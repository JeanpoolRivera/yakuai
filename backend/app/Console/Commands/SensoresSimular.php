<?php

namespace App\Console\Commands;

use App\Models\Forecast;
use App\Models\Measurement;
use App\Models\Plot;
use App\Models\Sensor;
use App\Services\SensorNormalizer;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Database\QueryException;

#[Signature('yakuai:sensores:simular {plot : ID de la parcela de prueba} {--minutos=15 : Paso de simulación}')]
#[Description('Simula humedad coherente (solo prueba, origin=demo) para una parcela.')]
class SensoresSimular extends Command
{
    public function handle(SensorNormalizer $normalizer): int
    {
        $plotId = (int) $this->argument('plot');
        $plot = Plot::find($plotId);

        if ($plot === null) {
            $this->error("Parcela #{$plotId} no existe.");

            return self::FAILURE;
        }

        $sensor = Sensor::where('plot_id', $plot->id)
            ->where('type', 'humedad')
            ->where('is_active', true)
            ->first();

        if ($sensor === null || $sensor->dry_ref === null || $sensor->wet_ref === null) {
            $this->error('La parcela no tiene sensor de humedad activo calibrado.');

            return self::FAILURE;
        }

        $now = now();
        $ultima = Measurement::where('sensor_id', $sensor->id)
            ->latest('measured_at')
            ->first();

        $pct = $ultima?->norm_value !== null ? (float) $ultima->norm_value : 25.0;

        // Pérdida coherente: más al mediodía, menos de noche.
        $h = (int) $now->format('H');
        $perdida = ($h >= 11 && $h < 15) ? 0.40 : (($h >= 5 && $h < 19) ? 0.22 : 0.07);

        // Ganancia por lluvia OWM reciente (6h).
        $forecast = Forecast::where('plot_id', $plot->id)->latest('fetched_at')->first();
        $ganancia = 0.0;
        if ($forecast !== null && $forecast->rain_mm > 0) {
            $ganancia = min(8.0, (float) $forecast->rain_mm * 0.5 * (float) $forecast->rain_prob);
        }

        $ruido = (mt_rand(-30, 30) / 100); // ±0.30
        $nuevo = max(5.0, min(45.0, $pct - $perdida + $ganancia + $ruido));
        $nuevo = round($nuevo, 2);

        // Convertir % a crudo con la calibración del sensor.
        $raw = $sensor->dry_ref - ($nuevo / 100) * ($sensor->dry_ref - $sensor->wet_ref);

        $result = $normalizer->normalize('humedad', (float) $raw, $sensor->dry_ref, $sensor->wet_ref);

        try {
            Measurement::create([
                'sensor_id' => $sensor->id,
                'plot_id' => $sensor->plot_id,
                'measured_at' => $now,
                'raw_value' => round($raw, 2),
                'norm_value' => $result['norm'],
                'quality' => $result['quality'],
                'origin' => 'demo',
            ]);
        } catch (QueryException $e) {
            if ($e->getCode() === '23000') {
                $this->warn('Medición duplicada en este minuto, se omite.');

                return self::SUCCESS;
            }

            throw $e;
        }

        $this->info(sprintf('Parcela #%d: %.2f%% → %.2f%% (lluvia +%.2f).', $plot->id, $pct, $nuevo, $ganancia));

        return self::SUCCESS;
    }
}
