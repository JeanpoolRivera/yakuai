<?php

namespace App\Services;

use App\Models\FarmerInvitation;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class FarmerInvitationService
{
    public function send(User $user, string $email): bool
    {
        FarmerInvitation::query()
            ->where('user_id', $user->id)
            ->whereNull('accepted_at')
            ->delete();

        $token = Str::random(64);
        FarmerInvitation::create([
            'user_id' => $user->id,
            'email' => $email,
            'token_hash' => hash('sha256', $token),
            'expires_at' => now()->addHours(24),
        ]);

        $activationUrl = rtrim((string) config('services.frontend.url'), '/')
            .'/activar-cuenta#token='.urlencode($token);

        try {
            Mail::send('emails.farmer-invitation', ['name' => $user->name, 'activationUrl' => $activationUrl], function ($message) use ($email): void {
                $message->to($email)->subject('YakuAI - Activa tu cuenta de agricultor');
            });

            return true;
        } catch (\Throwable $e) {
            Log::error('Brevo SMTP: fallo al enviar invitación de agricultor', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}