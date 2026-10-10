<?php

namespace App\Http\Controllers;

use App\Concerns\BelongsToFarmer;
use App\Http\Requests\MeasurementRequest;
use App\Models\Measurement;
use App\Models\Sensor;
use App\Services\SensorNormalizer;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeasurementController extends Controller
{
    use BelongsToFarmer;

    public function index(Request $request): JsonResponse
    {
        $query = Measurement::query()->with('sensor')->latest('measured_at');

        $this->scopeToFarmerPlots($query, $request);

        if ($request->filled('sensor_id')) {
            $query->where('sensor_id', $request->integer('sensor_id'));
        }

        if ($request->filled('plot_id')) {
            $query->where('plot_id', $request->integer('plot_id'));
        }

        return response()->json($query->paginate(20));
    }

    public function store(MeasurementRequest $request, SensorNormalizer $normalizer): JsonResponse
    {
        $data = $request->validated();
        $sensor = Sensor::findOrFail($data['sensor_id']);

        if ($sensor->is_active === false) {
            return response()->json([
                'error' => ['message' => 'Sensor inactivo.'],
            ], 422);
        }

        $result = $normalizer->normalize(
            $sensor->type,
            (float) $data['raw_value'],
            $sensor->dry_ref,
            $sensor->wet_ref
        );

        try {
            $measurement = Measurement::create([
                'sensor_id' => $sensor->id,
                'plot_id' => $sensor->plot_id,
                'measured_at' => $data['measured_at'],
                'raw_value' => $data['raw_value'],
                'norm_value' => $result['norm'],
                'quality' => $result['quality'],
                'origin' => $data['origin'] ?? 'manual',
            ]);
        } catch (QueryException $e) {
            if ($e->getCode() === '23000') {
                $existing = Measurement::where('sensor_id', $sensor->id)
                    ->where('measured_at', $data['measured_at'])
                    ->first();

                return response()->json([
                    'data' => $existing,
                    'error' => ['message' => 'Medición duplicada: se devuelve la existente.'],
                ], 409);
            }

            throw $e;
        }

        $sensor->update(['status' => $result['quality'] === 'ok' ? 'ok' : 'anomalo']);

        return response()->json(['data' => $measurement], 201);
    }
}
