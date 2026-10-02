<?php

namespace App\Services;

use App\Models\Crop;
use App\Models\Forecast;
use App\Models\Measurement;
use App\Models\Plot;
use App\Models\Sensor;
use Carbon\CarbonImmutable;

/**
 * Matriz F7: 10 casos demo sobre papa/franco/100m²/goteo-0.9.
 * No toca la BD: usa modelos en memoria con hora fija.
 */
class ValidationService
{
    public function __construct(private HydroService $hydro) {}

    /**
     * @return list<array{caso: string, esperado: string, obtenido: string, ok: bool, detalle: string}>
     */
    public function run(): array
    {
        $now = CarbonImmutable::parse('2026-09-22T10:00:00');
        $cases = [
            ['Humedad suficiente no riega', 'no', 25.0, null, null, null],
            ['Bajo umbral riega 4650-4700', 'riega', 20.0, null, null, '4650-4700'],
            ['Lluvia suficiente espera', 'espera', 20.0, 60.0, 0.9, null],
            ['Prob baja no espera', 'riega', 20.0, 60.0, 0.6, null],
            ['Lluvia poca no espera', 'riega', 20.0, 2.0, 0.9, null],
            ['Crítico riega aunque llueva', 'riega', 10.0, 100.0, 0.95, 'critica'],
            ['Sin medición incompleta', 'incompleta', null, null, null, null],
            ['Medición 40min incompleta', 'incompleta', 20.0, null, null, 'vencida_med'],
            ['Pronóstico 4h incompleta', 'incompleta', 20.0, 0.0, 0.0, 'vencido_cli'],
            ['En umbral 21.75 riega', 'riega', 21.75, null, null, null],
        ];

        $results = [];

        foreach ($cases as [$nombre, $esperado, $hum, $lluvia, $prob, $extra]) {
            [$plot, $measurement, $forecast] = $this->inputs($hum, $lluvia, $prob, $extra, $now);
            $calc = $this->hydro->evaluate($plot, $measurement, $forecast, $now);
            $ok = $calc['result'] === $esperado
                && ($extra !== '4650-4700' || ((int) $calc['min_liters'] === 4650 && (int) $calc['max_liters'] === 4700))
                && ($extra !== 'critica' || $calc['is_critical'] === true);

            $results[] = [
                'caso' => $nombre,
                'esperado' => $esperado,
                'obtenido' => $calc['result'],
                'ok' => $ok,
                'detalle' => $calc['reason']
                    .($calc['min_liters'] !== null ? " {$calc['min_liters']}-{$calc['max_liters']} L" : ''),
            ];
        }

        return $results;
    }

    /**
     * @return array{0: Plot, 1: Measurement|null, 2: Forecast|null}
     */
    private function inputs(?float $hum, ?float $lluvia, ?float $prob, ?string $extra, CarbonImmutable $now): array
    {
        $crop = Crop::where('code', 'papa')->firstOrFail();

        $plot = new Plot([
            'farmer_id' => 0,
            'name' => 'Demo',
            'latitude' => -12.0667,
            'longitude' => -75.2833,
            'area_m2' => 100,
            'crop_id' => $crop->id,
            'sowing_date' => $now->subDays(70)->toDateString(),
            'soil_texture_code' => 'franco',
            'irrigation_system' => 'goteo',
            'irrigation_efficiency' => 0.90,
        ]);

        $measurement = null;
        if ($hum !== null) {
            $sensor = new Sensor([
                'plot_id' => 0, 'type' => 'humedad', 'dry_ref' => 1020, 'wet_ref' => 320,
            ]);
            $at = $extra === 'vencida_med' ? $now->subMinutes(40) : $now->subMinutes(5);
            $measurement = new Measurement([
                'measured_at' => $at,
                'raw_value' => 1020 - $hum / 100 * 700,
                'norm_value' => $hum,
                'quality' => 'ok',
            ]);
            $measurement->setRelation('sensor', $sensor);
        }

        $forecast = new Forecast([
            'fetched_at' => $extra === 'vencido_cli' ? $now->subHours(4) : $now->subMinutes(5),
            'period_from' => $now,
            'period_to' => $now->addHours(6),
            'temp_max' => 25,
            'temp_min' => 12,
            'rain_mm' => $lluvia ?? 0,
            'rain_prob' => $prob ?? 0,
        ]);

        return [$plot, $measurement, $forecast];
    }
}
