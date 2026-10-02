<?php

namespace App\Services;

use App\Models\Forecast;
use App\Models\Plot;
use Illuminate\Support\Facades\Http;

/**
 * Proveedor OpenWeatherMap con caída a demo.
 * Ventana v1: próximas 6 h agregadas del pronóstico 3-horario gratuito.
 * Si no hay key o la API falla, se guarda origen demo/manual con el
 * mismo esquema para no rehacer nada cuando llegue la key activa.
 */
class OwmService
{
    /**
     * @param  array{rain_mm?: float, rain_prob?: float, temp_max?: float, temp_min?: float}|null  $demo
     */
    public function refresh(Plot $plot, ?array $demo = null): Forecast
    {
        $key = config('services.owm.key');

        if ($demo !== null || $key === null || $key === '') {
            return $this->storeDemo($plot, $demo ?? []);
        }

        try {
            $response = Http::timeout((int) config('services.owm.timeout', 15))->get(
                'https://api.openweathermap.org/data/2.5/forecast',
                [
                    'lat' => $plot->latitude,
                    'lon' => $plot->longitude,
                    'appid' => $key,
                    'units' => 'metric',
                    'lang' => 'es',
                ]
            );

            if (! $response->successful()) {
                return $this->storeDemo($plot, [], 'owm_fallo_'.$response->status());
            }

            return $this->storeAggregated($plot, $response->json());
        } catch (\Throwable) {
            return $this->storeDemo($plot, [], 'owm_error');
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function storeAggregated(Plot $plot, array $payload): Forecast
    {
        $items = array_slice(is_array($payload['list'] ?? null) ? $payload['list'] : [], 0, 2);
        $rainMm = 0.0;
        $rainProb = 0.0;
        $temps = [];

        foreach ($items as $item) {
            $rainMm += (float) ($item['rain']['3h'] ?? 0);
            $rainProb = max($rainProb, (float) ($item['pop'] ?? 0));
            $temps[] = (float) ($item['main']['temp_max'] ?? $item['main']['temp'] ?? 0);
            $temps[] = (float) ($item['main']['temp_min'] ?? $item['main']['temp'] ?? 0);
        }

        $now = now();

        return Forecast::create([
            'plot_id' => $plot->id,
            'fetched_at' => $now,
            'issued_at' => $now,
            'period_from' => $now,
            'period_to' => $now->copy()->addHours(6),
            'temp_max' => $temps === [] ? null : round(max($temps), 2),
            'temp_min' => $temps === [] ? null : round(min($temps), 2),
            'rain_mm' => round($rainMm, 2),
            'rain_prob' => round($rainProb, 2),
            'raw_json' => $payload,
            'origin' => 'owm',
        ]);
    }

    /**
     * @param  array{rain_mm?: float, rain_prob?: float, temp_max?: float, temp_min?: float}  $demo
     */
    private function storeDemo(Plot $plot, array $demo, string $origin = 'demo'): Forecast
    {
        $now = now();

        return Forecast::create([
            'plot_id' => $plot->id,
            'fetched_at' => $now,
            'issued_at' => $now,
            'period_from' => $now,
            'period_to' => $now->copy()->addHours(6),
            'temp_max' => isset($demo['temp_max']) ? round((float) $demo['temp_max'], 2) : 24.0,
            'temp_min' => isset($demo['temp_min']) ? round((float) $demo['temp_min'], 2) : 12.0,
            'rain_mm' => round((float) ($demo['rain_mm'] ?? 0), 2),
            'rain_prob' => round((float) ($demo['rain_prob'] ?? 0), 2),
            'raw_json' => ['demo' => true, 'nota' => 'Mismo esquema que OWM real'],
            'origin' => $origin === 'demo' ? 'demo' : $origin,
        ]);
    }
}
