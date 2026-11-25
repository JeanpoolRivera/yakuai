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

    public function test_matriz_expone_casos_y_resumen_consistente(): void
    {
        $this->seed(CatalogSeeder::class);
        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']), ['*']);

        $response = $this->getJson('/api/v1/validation')->assertOk();

        $cases = $response->json('data.cases');
        $this->assertSame(10, $response->json('data.total'));
        $this->assertCount(10, $cases);
        $this->assertSame(
            count(array_filter($cases, fn (array $case): bool => $case['ok'])),
            $response->json('data.passed')
        );

        foreach ($cases as $case) {
            $this->assertArrayHasKey('caso', $case);
            $this->assertArrayHasKey('esperado', $case);
            $this->assertArrayHasKey('obtenido', $case);
            $this->assertArrayHasKey('ok', $case);
        }
    }

    public function test_agricultor_no_ve_validacion(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'agricultor']), ['ver']);

        $this->getJson('/api/v1/validation')->assertForbidden();
    }
}
