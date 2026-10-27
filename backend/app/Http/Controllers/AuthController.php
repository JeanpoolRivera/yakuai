<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Models\AuditLog;
use App\Models\FarmerInvitation;
use App\Models\User;
use App\Rules\EmailAddress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class AuthController extends Controller
{
    public function unified(LoginRequest $request): JsonResponse
    {
        $data = $request->validated();
        $email = strtolower(trim($data['email']));
        $secret = $data['secret'];

        $user = User::where('email', $email)->first();

        if ($user === null) {
            $this->logFailedLogin($email, null, 'usuario_no_encontrado');
            return response()->json([
                'error' => ['message' => 'Credenciales incorrectas.'],
            ], 401);
        }

        if ($user->role === 'agricultor') {
            if ($user->pin_code === null) {
                return response()->json(['error' => ['message' => 'Activa tu cuenta desde el enlace de invitación enviado a tu correo.']], 409);
            }

            $lockKey = 'pin-lock:'.$email;
            $failKey = 'pin-fail:'.$email;

            if (Cache::has($lockKey)) {
                return response()->json([
                    'error' => ['message' => 'Cuenta bloqueada por intentos. Espera 15 minutos.'],
                ], 429);
            }

            if (! preg_match('/^\d{4}$/', $secret) || ! Hash::check($secret, $user->pin_code)) {
                $fails = (int) Cache::get($failKey, 0) + 1;
                Cache::put($failKey, $fails, now()->addMinutes(15));

                if ($fails >= 5) {
                    Cache::put($lockKey, true, now()->addMinutes(15));
                    Cache::forget($failKey);

                    $this->logFailedLogin($email, $user, 'pin_bloqueado');
                    return response()->json([
                        'error' => ['message' => 'Cuenta bloqueada por intentos. Espera 15 minutos.'],
                    ], 429);
                }

                $this->logFailedLogin($email, $user, 'pin_incorrecto');
                return response()->json([
                    'error' => ['message' => 'Credenciales incorrectas.'],
                ], 401);
            }

            Cache::forget($failKey);

            return $this->tokenResponse($user, 'pin', ['ver', 'evaluar', 'regar']);
        }

        if (! Hash::check($secret, $user->password)) {
            $this->logFailedLogin($email, $user, 'password_incorrecto');
            return response()->json([
                'error' => ['message' => 'Credenciales incorrectas.'],
            ], 401);
        }

        return $this->tokenResponse($user, 'web');
    }

    public function activateFarmer(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'regex:/^[A-Za-z0-9]{64}$/'],
            'new_pin' => ['required', 'string', 'regex:/^\d{4}$/'],
            'new_pin_confirmation' => ['required', 'same:new_pin'],
        ]);

        DB::transaction(function () use ($data): void {
            $invitation = FarmerInvitation::query()
                ->where('token_hash', hash('sha256', $data['token']))
                ->lockForUpdate()
                ->first();

            if ($invitation === null || $invitation->accepted_at !== null || $invitation->expires_at->isPast()) {
                throw ValidationException::withMessages(['token' => ['La invitación venció o ya fue usada. Solicita una nueva.']]);
            }

            $user = $invitation->user()->lockForUpdate()->firstOrFail();
            $emailInUse = User::query()->where('email', $invitation->email)->whereKeyNot($user->id)->exists();
            if ($emailInUse) {
                throw ValidationException::withMessages(['token' => ['Ese correo ya está asociado a otra cuenta. Contacta a tu técnico.']]);
            }

            $user->update([
                'email' => $invitation->email,
                'email_verified_at' => now(),
                'pin_code' => $data['new_pin'],
            ]);
            $invitation->update(['accepted_at' => now()]);
            $user->invitations()->whereNull('accepted_at')->whereKeyNot($invitation->id)->delete();
        });

        return response()->json(['data' => ['message' => 'Cuenta activada. Ya puedes iniciar sesión con tu correo y PIN.']]);
    }

    public function recoverPin(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string', new EmailAddress, 'max:254'],
        ]);
        $email = strtolower(trim($data['email']));
        $user = User::where('email', $email)
            ->where('role', 'agricultor')
            ->first();

        if ($user !== null && $user->pin_code === null) {
            return response()->json([
                'error' => ['message' => 'Esta cuenta aún debe activarse desde la invitación enviada al correo.'],
            ], 409);
        }

        if ($user === null) {
            return response()->json([
                'error' => ['message' => 'No existe una cuenta de agricultor con ese correo.'],
            ], 404);
        }

        $recoveryCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        Cache::put('pin-recovery:'.$email, $recoveryCode, now()->addMinutes(10));

        if (! $this->sendRecoveryEmail($user, $recoveryCode)) {
            Cache::forget('pin-recovery:'.$email);

            return response()->json([
                'error' => ['message' => 'No se pudo enviar el correo de recuperación. Inténtalo más tarde.'],
            ], 503);
        }

        return response()->json([
            'data' => ['message' => 'Código de recuperación enviado a tu correo.'],
        ]);
    }

    public function resetPin(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string', new EmailAddress, 'max:254'],
            'recovery_code' => ['required', 'string', 'regex:/^\d{6}$/'],
            'new_pin' => ['required', 'string', 'regex:/^\d{4}$/'],
        ]);
        $email = strtolower(trim($data['email']));
        $recoveryCode = $data['recovery_code'];
        $newPin = $data['new_pin'];
        $cachedCode = Cache::get('pin-recovery:'.$email);

        if ($cachedCode === null || ! hash_equals($cachedCode, $recoveryCode)) {
            return response()->json([
                'error' => ['message' => 'Código de recuperación inválido o expirado.'],
            ], 401);
        }

        $user = User::where('email', $email)
            ->where('role', 'agricultor')
            ->first();

        if ($user !== null && $user->pin_code === null) {
            return response()->json([
                'error' => ['message' => 'Esta cuenta aún debe activarse desde la invitación enviada al correo.'],
            ], 409);
        }

        if ($user === null) {
            return response()->json([
                'error' => ['message' => 'Usuario no encontrado.'],
            ], 404);
        }

        $user->update([
            'pin_code' => $newPin,
            'backup_code' => null,
        ]);

        Cache::forget('pin-recovery:'.$email);

        AuditLog::create([
            'action' => 'pin_reseteado',
            'user_id' => $user->id,
            'ip_address' => $request->ip(),
            'details' => ['email' => $email],
        ]);

        return response()->json([
            'data' => ['message' => 'PIN actualizado correctamente.'],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => $request->user()->only(['id', 'name', 'email', 'role'])]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['data' => ['message' => 'Sesión cerrada.']]);
    }

    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user === null) {
            return response()->json([
                'error' => ['message' => 'No autenticado.'],
            ], 401);
        }

        $user->currentAccessToken()->delete();

        return $this->tokenResponse($user, 'refresh', ['*']);
    }

    private function sendRecoveryEmail(User $user, string $code): bool
    {
        try {
            Mail::send('emails.pin-recovery', ['code' => $code], function ($message) use ($user) {
                $message->to($user->email)->subject('YakuAI - Código de recuperación de PIN');
            });

            return true;
        } catch (\Throwable $e) {
            Log::error('Brevo SMTP: fallo al enviar email', ['error' => $e->getMessage()]);

            return false;
        }
    }

    private function logFailedLogin(string $email, ?User $user, string $reason): void
    {
        AuditLog::create([
            'action' => 'login_fallido',
            'user_id' => $user?->id,
            'ip_address' => request()->ip(),
            'details' => [
                'email' => $email,
                'razon' => $reason,
            ],
        ]);
    }

    /**
     * @param  list<string>  $abilities
     */
    private function tokenResponse(User $user, string $name, array $abilities = ['*']): JsonResponse
    {
        if ($user->is_active === false) {
            return response()->json([
                'error' => ['message' => 'Cuenta inactiva.'],
            ], 401);
        }

        $token = $user->createToken($name, $abilities, now()->addHours(8));

        return response()->json([
            'data' => [
                'access_token' => $token->plainTextToken,
                'token_type' => 'Bearer',
                'expires_at' => $token->accessToken->expires_at,
                'user' => $user->only(['id', 'name', 'email', 'role']),
            ],
        ]);
    }
}
