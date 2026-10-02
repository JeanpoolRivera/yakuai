<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    /**
     * Crea el admin inicial solo si YAKUAI_ADMIN_EMAIL y
     * YAKUAI_ADMIN_PASSWORD vienen por entorno. Idempotente.
     */
    public function run(): void
    {
        $email = env('YAKUAI_ADMIN_EMAIL');
        $password = env('YAKUAI_ADMIN_PASSWORD');

        if (! is_string($email) || $email === '' || ! is_string($password) || $password === '') {
            $this->command->warn('YAKUAI_ADMIN_EMAIL/PASSWORD ausentes: no se crea admin.');

            return;
        }

        User::firstOrCreate(['email' => $email], [
            'name' => 'Administrador',
            'password' => $password,
            'role' => 'admin',
        ]);
    }
}
