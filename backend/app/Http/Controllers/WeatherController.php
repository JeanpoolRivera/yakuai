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
        $forbidden = $this->forbiddenIfCantAccessPlot($request, $plot);
        if ($forbidden !== null) {
            return $forbidden;
        }

        $forecast = $owm->refresh($plot);

        return response()->json(['data' => $forecast], 201);
    }
}
