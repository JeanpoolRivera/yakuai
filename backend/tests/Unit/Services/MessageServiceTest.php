<?php

namespace Tests\Unit\Services;

use App\Models\Evaluation;
use App\Models\Plot;
use App\Services\MessageService;
use Carbon\Carbon;
use Tests\TestCase;

class MessageServiceTest extends TestCase
{
    public function test_mensaje_de_riego_incluye_plan_guardado_y_recomendacion(): void
    {
        $evaluation = $this->evaluation([
            'result' => 'riega',
            'min_liters' => 450,
            'max_liters' => 500,
            'is_critical' => true,
            'inputs_snapshot' => [
                'plan' => [
                    'litros' => 475,
                    'minutos' => 40,
                    'inicio' => '2026-11-16 05:45:00',
                    'fin' => '2026-11-16 06:25:00',
                ],
            ],
        ]);

        $message = (new MessageService)->forEvaluation($evaluation);

        $this->assertStringContainsString('Parcela Norte', $message);
        $this->assertStringContainsString('Toca regar hoy mismo', $message);
        $this->assertStringContainsString('Riega 475 litros (rango 450–500)', $message);
        $this->assertStringContainsString('Inicia: 2026-11-16 05:45', $message);
        $this->assertStringContainsString('Termina: 2026-11-16 06:25', $message);
    }

    public function test_mensaje_de_espera_explica_la_lluvia(): void
    {
        $message = (new MessageService)->forEvaluation($this->evaluation(['result' => 'espera']));

        $this->assertStringContainsString('Mejor espera, ya viene la lluvia', $message);
        $this->assertStringContainsString('Espera antes de regar', $message);
    }

    public function test_mensaje_de_resultado_no_indica_humedad_suficiente(): void
    {
        $message = (new MessageService)->forEvaluation($this->evaluation(['result' => 'no']));

        $this->assertStringContainsString('Tu tierra está bien, no riegues hoy', $message);
        $this->assertStringContainsString('La tierra aún tiene agua suficiente', $message);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function evaluation(array $attributes): Evaluation
    {
        $evaluation = new Evaluation($attributes + [
            'result' => 'no',
            'is_critical' => false,
            'inputs_snapshot' => [],
        ]);
        $evaluation->setRelation('plot', new Plot(['name' => 'Parcela Norte']));

        if (array_key_exists('next_at', $attributes) && is_string($attributes['next_at'])) {
            $evaluation->next_at = Carbon::parse($attributes['next_at']);
        }

        return $evaluation;
    }
}
