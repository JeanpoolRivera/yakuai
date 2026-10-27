<?php

namespace App\Http\Controllers;

use App\Concerns\BelongsToFarmer;
use App\Http\Requests\FarmerRequest;
use App\Models\Farmer;
use App\Models\User;
use App\Services\FarmerInvitationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FarmerController extends Controller
{
    use BelongsToFarmer;

    public function index(Request $request): JsonResponse
    {
        if ($request->user()->role === 'agricultor') {
            return response()->json(['error' => ['message' => 'Sin permiso para esta acción.']], 403);
        }

        $farmers = Farmer::query()
            ->withCount('plots')
            ->with(['accessAccount:id,farmer_id,email,pin_code', 'accessAccount.latestInvitation'])
            ->paginate(20);
        $farmers->getCollection()->transform(fn (Farmer $farmer): Farmer => $this->includeAccessDetails($farmer));

        return response()->json($farmers);
    }

    public function store(FarmerRequest $request, FarmerInvitationService $invitations): JsonResponse
    {
        $data = $request->validated();
        $email = $this->normalizedEmail($data['email'] ?? null);
        unset($data['email']);

        [$farmer, $account] = DB::transaction(function () use ($data, $email): array {
            $farmer = Farmer::create($data);
            $account = $email === null ? null : $this->createAccessAccount($farmer, $email);

            return [$farmer, $account];
        });

        $invitationSent = $account === null ? null : $invitations->send($account, $email);
        $farmer->load(['accessAccount:id,farmer_id,email,pin_code', 'accessAccount.latestInvitation']);
        $data = $this->includeAccessDetails($farmer);
        $data->setAttribute('invitation_sent', $invitationSent);

        return response()->json(['data' => $data], 201);
    }

    public function show(Request $request, Farmer $farmer): JsonResponse
    {
        if ($request->user()->role === 'agricultor' && $farmer->id !== $request->user()->farmer_id) {
            return response()->json(['error' => ['message' => 'Sin permiso para esta acción.']], 403);
        }

        return response()->json(['data' => $this->includeAccessDetails($farmer->load(['plots', 'accessAccount:id,farmer_id,email,pin_code', 'accessAccount.latestInvitation']))]);
    }

    public function update(FarmerRequest $request, Farmer $farmer, FarmerInvitationService $invitations): JsonResponse
    {
        $data = $request->validated();
        $emailWasProvided = array_key_exists('email', $data);
        $email = $this->normalizedEmail($data['email'] ?? null);
        unset($data['email']);

        [$farmer, $account, $invitationEmail] = DB::transaction(function () use ($data, $emailWasProvided, $email, $farmer): array {
            $farmer->update($data);
            $account = $farmer->accessAccount()->first();
            $invitationEmail = null;

            if ($emailWasProvided && $email !== null) {
                if ($account === null) {
                    $account = $this->createAccessAccount($farmer, $email);
                    $invitationEmail = $email;
                } elseif (strcasecmp($account->email, $email) !== 0) {
                    $latestInvitation = $account->latestInvitation()->first();
                    $alreadyPendingForEmail = $latestInvitation !== null
                        && $latestInvitation->accepted_at === null
                        && strcasecmp($latestInvitation->email, $email) === 0;
                    if (! $alreadyPendingForEmail) {
                        $invitationEmail = $email;
                    }
                }
            }

            if ($account !== null) {
                $account->update(['name' => $farmer->name, 'is_active' => $farmer->is_active]);
            }

            return [$farmer, $account, $invitationEmail];
        });

        $invitationSent = $invitationEmail === null ? null : $invitations->send($account, $invitationEmail);
        $farmer->load(['accessAccount:id,farmer_id,email,pin_code', 'accessAccount.latestInvitation']);
        $response = $this->includeAccessDetails($farmer);
        $response->setAttribute('invitation_sent', $invitationSent);

        return response()->json(['data' => $response]);
    }

    public function resendInvitation(Request $request, Farmer $farmer, FarmerInvitationService $invitations): JsonResponse
    {
        if (! in_array($request->user()->role, ['admin', 'tecnico'], true)) {
            return response()->json(['error' => ['message' => 'Sin permiso para esta acción.']], 403);
        }

        $account = $farmer->accessAccount()->with('latestInvitation')->first();
        if ($account === null) {
            return response()->json(['error' => ['message' => 'Este agricultor no tiene una cuenta de acceso.']], 422);
        }

        $latestInvitation = $account->latestInvitation;
        if ($account->pin_code !== null && ($latestInvitation === null || $latestInvitation->accepted_at !== null)) {
            return response()->json(['error' => ['message' => 'La cuenta ya está activada.']], 409);
        }

        $email = $latestInvitation !== null && $latestInvitation->accepted_at === null
            ? $latestInvitation->email
            : $account->email;

        if (! $invitations->send($account, $email)) {
            return response()->json(['error' => ['message' => 'No se pudo enviar la invitación. Inténtalo de nuevo.']], 503);
        }

        return response()->json(['data' => ['message' => 'Invitación enviada.']]);
    }

    private function createAccessAccount(Farmer $farmer, string $email): User
    {
        return User::create([
            'name' => $farmer->name,
            'email' => $email,
            'password' => Str::random(64),
            'role' => 'agricultor',
            'farmer_id' => $farmer->id,
            'is_active' => $farmer->is_active,
            'pin_code' => null,
            'email_verified_at' => null,
        ]);
    }

    private function normalizedEmail(?string $email): ?string
    {
        $email = strtolower(trim((string) $email));

        return $email === '' ? null : $email;
    }

    private function includeAccessDetails(Farmer $farmer): Farmer
    {
        $account = $farmer->accessAccount;
        $invitation = $account?->latestInvitation;
        $pending = $invitation !== null && $invitation->accepted_at === null;
        $status = $account === null
            ? 'sin_cuenta'
            : ($pending
                ? ($invitation->expires_at->isPast() ? 'invitacion_vencida' : 'invitacion_pendiente')
                : ($account->pin_code === null ? 'invitacion_requerida' : 'activo'));

        $farmer->setAttribute('email', $pending ? $invitation->email : $account?->email);
        $farmer->setAttribute('access_status', $status);
        $farmer->setAttribute('can_resend_invitation', ($account !== null && $account->pin_code === null) || $pending);
        $farmer->unsetRelation('accessAccount');

        return $farmer;
    }
}