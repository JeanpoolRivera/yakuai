<?php

namespace App\Http\Controllers;

use App\Concerns\BelongsToFarmer;
use App\Models\Forecast;
use App\Models\Plot;
use App\Services\OwmService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WeatherController extends Controller
{
    use BelongsToFarmer;

    public function latest(Request $request, Plot $plot): JsonResponse
    {
        $forbidden = $this->forbiddenIfCantAccessPlot($request, $plot);
        if ($forbidden !== null) {
            return $forbidden;
        }

        $forecast = Forecast::where('plot_id', $plot->id)->latest('fetched_at')->first();

        if ($forecast === null) {
            return response()->json([
                'error' => ['message' => 'Sin pronóstico. Actualiza el clima.'],
            ], 404);
        }

        return response()->json(['data' => $forecast]);
    }

    public function refresh(Request $request, Plot $plot, OwmService $owm): JsonResponse
    {
        if (! in_array($request->user()->role, ['admin', 'tecnico'], true)) {
            return response()->json([
                'error' => ['message' => 'Sin permiso para esta acción.'],
            ], 403);
        }

        $demo = $request->validate([
            'demo' => ['sometimes', 'array'],
            'demo.rain_mm' => ['sometimes', 'numeric', 'min:0'],
            'demo.rain_prob' => ['sometimes', 'numeric', 'min:0', 'max:1'],
            'demo.temp_max' => ['sometimes', 'numeric'],
            'demo.temp_min' => ['sometimes', 'numeric'],
        ])['demo'] ?? null;

        $forecast = $owm->refresh($plot, $demo);

        return response()->json(['data' => $forecast], 201);
    }
}
