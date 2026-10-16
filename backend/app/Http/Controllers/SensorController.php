<?php

namespace App\Http\Controllers;

use App\Concerns\BelongsToFarmer;
use App\Http\Requests\SensorRequest;
use App\Models\Forecast;
use App\Models\Measurement;
use App\Models\Sensor;
use App\Services\SensorNormalizer;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SensorController extends Controller
{
    use BelongsToFarmer;

    public function index(Request $request): JsonResponse
    {
        $query = Sensor::query()->with(['plot', 'latestMeasurement']);

        $this->scopeToFarmerPlots($query, $request);

        if ($request->filled('plot_id')) {
            $query->where('plot_id', $request->integer('plot_id'));
        }

        return response()->json($query->paginate(20));
    }

    public function store(SensorRequest $request): JsonResponse
    {
        $sensor = Sensor::create($request->validated());

        return response()->json(['data' => $sensor], 201);
    }

    public function show(Request $request, Sensor $sensor): JsonResponse
    {
        $forbidden = $this->forbiddenIfCantAccessPlot($request, $sensor->plot);
        if ($forbidden !== null) {
            return $forbidden;
        }

        $sensor->load(['plot', 'measurements' => fn ($q) => $q->latest('measured_at')->limit(5)]);

        return response()->json(['data' => $sensor]);
    }

    public function update(SensorRequest $request, Sensor $sensor): JsonResponse
    {
        $sensor->update($request->validated());

        return response()->json(['data' => $sensor]);
    }

    /**
     * Simula una lectura coherente (solo prueba, origin=demo).
     * Baja con el sol, sube con lluvia OWM reciente, ruido mínimo.
     */
    public function simular(Request $request, Sensor $sensor, SensorNormalizer $normalizer): JsonResponse
    {
        $forbidden = $this->forbiddenIfCantAccessPlot($request, $sensor->plot);
        if ($forbidden !== null) {
            return $forbidden;
        }

        if ($sensor->type !== 'humedad' || $sensor->dry_ref === null || $sensor->wet_ref === null) {
            return response()->json([
                'error' => ['message' => 'Solo sensores de humedad calibrados pueden simular.'],
            ], 422);
        }

        $now = now();
        $ultima = Measurement::where('sensor_id', $sensor->id)->latest('measured_at')->first();
        $pct = $ultima?->norm_value !== null ? (float) $ultima->norm_value : 25.0;

        $h = (int) $now->format('H');
        $perdida = ($h >= 11 && $h < 15) ? 0.40 : (($h >= 5 && $h < 19) ? 0.22 : 0.07);

        $forecast = Forecast::where('plot_id', $sensor->plot_id)->latest('fetched_at')->first();
        $ganancia = 0.0;
        if ($forecast !== null && $forecast->rain_mm > 0) {
            $ganancia = min(8.0, (float) $forecast->rain_mm * 0.5 * (float) $forecast->rain_prob);
        }

        $nuevo = round(max(5.0, min(45.0, $pct - $perdida + $ganancia + (mt_rand(-30, 30) / 100))), 2);
        $raw = $sensor->dry_ref - ($nuevo / 100) * ($sensor->dry_ref - $sensor->wet_ref);
        $result = $normalizer->normalize('humedad', (float) $raw, $sensor->dry_ref, $sensor->wet_ref);

        try {
            $measurement = Measurement::create([
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
                return response()->json([
                    'error' => ['message' => 'Ya hay una medición en este minuto, espera un poco.'],
                ], 409);
            }

            throw $e;
        }

        $sensor->update(['status' => 'ok']);

        return response()->json(['data' => $measurement], 201);
    }
}
