<?php

namespace App\Http\Controllers;

use App\Concerns\BelongsToFarmer;
use App\Http\Requests\SensorRequest;
use App\Models\Sensor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SensorController extends Controller
{
    use BelongsToFarmer;

    public function index(Request $request): JsonResponse
    {
        $query = Sensor::query()->with('plot');

        $this->scopeToFarmer($query, $request);

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
}
