<?php

namespace Tests\Feature;

use App\Models\Farmer;
use App\Models\FarmerInvitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FarmerInvitationTest extends TestCase
{
    use RefreshDatabase;

    public function test_farmer_list_loads_pending_invitation_and_account_email(): void
    {
        $farmer = Farmer::create(['name' => 'Agricultora de prueba']);
        $account = User::factory()->create([
            'role' => 'agricultor',
            'farmer_id' => $farmer->id,
            'pin_code' => null,
        ]);
        FarmerInvitation::create([
            'user_id' => $account->id,
            'email' => $account->email,
            'token_hash' => str_repeat('a', 64),
            'expires_at' => now()->addDay(),
        ]);

        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']));

        $this->getJson('/api/v1/farmers')
            ->assertOk()
            ->assertJsonPath('data.0.email', $account->email)
            ->assertJsonPath('data.0.access_status', 'invitacion_pendiente')
            ->assertJsonPath('data.0.can_resend_invitation', true);
    }
}