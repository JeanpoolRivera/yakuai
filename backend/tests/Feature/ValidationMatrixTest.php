<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ValidationMatrixTest extends TestCase
{
    use RefreshDatabase;

    public function test_matriz_10_de_10(): void
    {
        $this->seed(CatalogSeeder::class);
        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']), ['*']);

        $response = $this->getJson('/api/v1/validation')->assertOk();

        $this->assertSame(10, $response->json('data.total'));
        $this->assertSame(10, $response->json('data.passed'));

        foreach ($response->json('data.cases') as $case) {
            $this->assertTrue($case['ok'], "Falla: {$case['caso']}");
        }
    }

    public function test_agricultor_no_ve_validacion(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'agricultor']), ['ver']);

        $this->getJson('/api/v1/validation')->assertForbidden();
    }
}
