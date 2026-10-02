<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_con_credenciales_validas_emite_token(): void
    {
        User::factory()->create([
            'email' => 'tecnico@example.test',
            'password' => bcrypt('Secreta123'),
            'role' => 'tecnico',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'tecnico@example.test',
            'secret' => 'Secreta123',
        ]);

        $response->assertOk()->assertJsonPath('data.token_type', 'Bearer');
        $this->assertNotEmpty($response->json('data.access_token'));
    }

    public function test_login_rechaza_secret_incorrecto(): void
    {
        User::factory()->create(['email' => 'a@example.test']);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'a@example.test',
            'secret' => 'mala',
        ])->assertUnauthorized();
    }

    public function test_login_unificado_con_pin_agricultor(): void
    {
        $user = User::factory()->create([
            'email' => 'agri@example.test',
            'role' => 'agricultor',
            'pin_code' => '1234',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'agri@example.test',
            'secret' => '1234',
        ])->assertOk();

        $this->assertNotEmpty($response->json('data.access_token'));
        $this->assertTrue($user->fresh()->is_active);
    }

    public function test_login_unificado_rechaza_pin_no_agricultor(): void
    {
        User::factory()->create([
            'email' => 'tec@example.test',
            'role' => 'tecnico',
            'pin_code' => '1234',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'tec@example.test',
            'secret' => '1234',
        ])->assertUnauthorized();
    }

    public function test_cuenta_inactiva_no_recibe_token(): void
    {
        User::factory()->create([
            'email' => 'off@example.test',
            'password' => bcrypt('Secreta123'),
            'is_active' => false,
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'off@example.test',
            'secret' => 'Secreta123',
        ])->assertUnauthorized();
    }
}
