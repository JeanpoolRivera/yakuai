<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
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
            $lockKey = 'pin-lock:'.$email;
            $failKey = 'pin-fail:'.$email;

            if (Cache::has($lockKey)) {
                return response()->json([
                    'error' => ['message' => 'Cuenta bloqueada por intentos. Espera 15 minutos.'],
                ], 429);
            }

            if ($user->pin_code === null || ! Hash::check($secret, $user->pin_code)) {
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

    public function recoverPin(Request $request): JsonResponse
    {
        $email = strtolower(trim($request->input('email', '')));

        if ($email === '') {
            return response()->json([
                'error' => ['message' => 'El email es requerido.'],
            ], 422);
        }

        $user = User::where('email', $email)
            ->where('role', 'agricultor')
            ->first();

        if ($user === null) {
            return response()->json([
                'error' => ['message' => 'No existe una cuenta de agricultor con ese email.'],
            ], 404);
        }

        $recoveryCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        Cache::put('pin-recovery:'.$email, $recoveryCode, now()->addMinutes(10));

        $this->sendRecoveryEmail($user, $recoveryCode);

        return response()->json([
            'data' => ['message' => 'Código de recuperación enviado a tu email.'],
        ]);
    }

    public function resetPin(Request $request): JsonResponse
    {
        $email = strtolower(trim($request->input('email', '')));
        $recoveryCode = trim($request->input('recovery_code', ''));
        $newPin = $request->input('new_pin', '');

        if ($email === '' || $recoveryCode === '' || $newPin === '') {
            return response()->json([
                'error' => ['message' => 'Todos los campos son requeridos.'],
            ], 422);
        }

        if (! preg_match('/^\d{4}$/', $newPin)) {
            return response()->json([
                'error' => ['message' => 'El PIN debe tener 4 dígitos numéricos.'],
            ], 422);
        }

        $cachedCode = Cache::get('pin-recovery:'.$email);

        if ($cachedCode === null || ! hash_equals($cachedCode, $recoveryCode)) {
            return response()->json([
                'error' => ['message' => 'Código de recuperación inválido o expirado.'],
            ], 401);
        }

        $user = User::where('email', $email)
            ->where('role', 'agricultor')
            ->first();

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

    private function sendRecoveryEmail(User $user, string $code): void
    {
        try {
            Mail::send('emails.pin-recovery', ['code' => $code], function ($message) use ($user) {
                $message->to($user->email)->subject('YakuAI - Código de recuperación de PIN');
            });
        } catch (\Throwable $e) {
            Log::error('Brevo SMTP: fallo al enviar email', ['error' => $e->getMessage()]);
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
