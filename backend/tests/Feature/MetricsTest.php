<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MetricsTest extends TestCase
{
    use RefreshDatabase;

    public function test_resumen_responde_con_indicadores(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']));

        $this->getJson('/api/v1/metrics/summary')
            ->assertOk()
            ->assertJsonStructure(['data' => [
                'plots_active', 'sensors_active', 'sensors_ok', 'sensors_sin_datos',
                'evaluations_today', 'evaluations_riega', 'evaluations_no',
                'evaluations_espera', 'evaluations_incompleta', 'critical_today',
            ]]);
    }
}
