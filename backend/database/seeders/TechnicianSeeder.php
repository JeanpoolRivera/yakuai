<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Validator;
use RuntimeException;

class TechnicianSeeder extends Seeder
{
    public function run(): void
    {
        $email = strtolower(trim((string) env('YAKUAI_TECHNICIAN_EMAIL', '')));
        $password = (string) env('YAKUAI_TECHNICIAN_PASSWORD', '');

        if ($email === '' || $password === '') {
            $this->command?->warn('YAKUAI_TECHNICIAN_EMAIL/PASSWORD no están configurados; no se modificó ninguna cuenta.');
            return;
        }

        Validator::make(
            ['email' => $email, 'password' => $password],
            ['email' => ['required', 'string', 'email:rfc', 'max:254'], 'password' => ['required', 'string', 'min:8', 'max:255']],
        )->validate();

        $user = User::query()->where('email', $email)->first();
        if ($user !== null && $user->role !== 'tecnico') {
            throw new RuntimeException('El correo configurado ya pertenece a una cuenta que no es técnica; no se modificó.');
        }

        $user ??= new User();
        $user->fill([
            'name' => 'Técnico',
            'email' => $email,
            'password' => $password,
            'role' => 'tecnico',
            'is_active' => true,
            'farmer_id' => null,
            'pin_code' => null,
        ]);
        $user->save();

        $this->command?->info('Cuenta técnica configurada: '.$email.' (ID '.$user->id.').');
    }
}
