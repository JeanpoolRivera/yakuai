<?php

namespace App\Http\Controllers;

use App\Concerns\BelongsToFarmer;
use App\Models\Evaluation;
use App\Models\Forecast;
use App\Models\Irrigation;
use App\Models\Measurement;
use App\Models\Plot;
use App\Services\HydroService;
use App\Services\MessageService;
use App\Services\OwmService;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EvaluationController extends Controller
{
    use BelongsToFarmer;

    /** Calculate a presentation scenario without saving readings, forecasts or evaluations. */
    public function evaluateDemo(Request $request, Plot $plot, HydroService $hydro): JsonResponse
    {
        if (! in_array($request->user()->role, ['tecnico', 'admin'], true)) {
            return response()->json(['error' => ['message' => 'Solo el personal técnico puede ejecutar una simulación.']], 403);
        }

        $forbidden = $this->forbiddenIfCantAccessPlot($request, $plot);
        if ($forbidden !== null) {
            return $forbidden;
        }

        $token = $request->user()->currentAccessToken();
        if ($token !== null && ! $token->can('*') && ! $token->can('evaluar')) {
            return response()->json(['error' => ['message' => 'Sin permiso para esta acción.']], 403);
        }

        $values = $request->validate([
            'humedad_pct' => ['required', 'numeric', 'between:0,100'],
            'rain_mm' => ['required', 'numeric', 'between:0,200'],
            'rain_prob' => ['required', 'numeric', 'between:0,1'],
        ]);

        $now = now();
        $measurement = new Measurement([
            'plot_id' => $plot->id,
            'measured_at' => $now,
            'raw_value' => $values['humedad_pct'],
            'norm_value' => $values['humedad_pct'],
            'quality' => 'ok',
            'origin' => 'demo',
        ]);
        $forecast = new Forecast([
            'plot_id' => $plot->id,
            'fetched_at' => $now,
            'temp_max' => 24,
            'temp_min' => 12,
            'rain_mm' => $values['rain_mm'],
            'rain_prob' => $values['rain_prob'],
            'origin' => 'demo',
        ]);

        $result = $hydro->evaluate($plot, $measurement, $forecast, $now);
        $result['confidence'] = 'media';
        $result['snapshot']['modo'] = 'demostracion';
        $result['snapshot']['humedad_pct'] = (float) $values['humedad_pct'];

        return response()->json(['data' => $result]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Evaluation::query()->with('plot')->latest('evaluated_at');

        $this->scopeToFarmerPlots($query, $request);

        if ($request->filled('plot_id') && $request->user()->role !== 'agricultor') {
            $query->where('plot_id', $request->integer('plot_id'));
        }

        return response()->json($query->paginate(20));
    }

    public function show(Request $request, Evaluation $evaluation): JsonResponse
    {
        $forbidden = $this->forbiddenIfCantAccessPlot($request, $evaluation->plot);
        if ($forbidden !== null) {
            return $forbidden;
        }

        return response()->json(['data' => $evaluation->load('plot')]);
    }

    public function evaluate(Request $request, Plot $plot, HydroService $hydro, OwmService $owm): JsonResponse
    {
        $user = $request->user();

        $forbidden = $this->forbiddenIfCantAccessPlot($request, $plot);
        if ($forbidden !== null) {
            return $forbidden;
        }

        $token = $user->currentAccessToken();

        if ($token !== null && ! $token->can('*') && ! $token->can('evaluar')) {
            return response()->json([
                'error' => ['message' => 'Sin permiso para esta acción.'],
            ], 403);
        }

        $now = now();
        $slot = $now->copy()->startOfHour();

        $existing = Evaluation::where('plot_id', $plot->id)
            ->where('evaluated_at', $slot)
            ->first();

        // Recalcula la evaluación de esta hora con lecturas nuevas, salvo que ya tenga un riego vinculado.
        if ($existing !== null && Irrigation::where('evaluation_id', $existing->id)->exists()) {
            return response()->json(['data' => $existing->load('plot')]);
        }

        $measurement = Measurement::where('plot_id', $plot->id)
            ->whereHas('sensor', fn ($q) => $q->where('type', 'humedad'))
            ->where('quality', 'ok')
            ->latest('measured_at')
            ->first();

        $forecast = Forecast::where('plot_id', $plot->id)
            ->latest('fetched_at')
            ->first();

        // Auto-refresh OWM: si no hay pronóstico o tiene >2h, traerlo solo.
        if ($forecast === null || $forecast->fetched_at->diffInMinutes($now) > 120) {
            $forecast = $owm->refresh($plot);
        }

        $calc = $hydro->evaluate($plot, $measurement, $forecast, $now);

        $values = [
                'plot_id' => $plot->id,
                'evaluated_at' => $slot,
                'stage' => $calc['stage'],
                'inputs_snapshot' => $calc['snapshot'],
                'result' => $calc['result'],
                'min_liters' => $calc['min_liters'],
                'max_liters' => $calc['max_liters'],
                'confidence' => $calc['confidence'],
                'reason' => $calc['reason'],
                'next_at' => $calc['next_at'],
                'is_critical' => $calc['is_critical'],
            ];

        try {
            if ($existing !== null) {
                $existing->update($values);
                $evaluation = $existing->fresh();
            } else {
                $evaluation = Evaluation::create($values);
            }
        } catch (QueryException $e) {
            if ($e->getCode() === '23000') {
                $existing = Evaluation::where('plot_id', $plot->id)
                    ->where('evaluated_at', $slot)
                    ->first();

                if ($existing !== null) {
                    return response()->json(['data' => $existing->load('plot')]);
                }
            }

            throw $e;
        }

        $status = $calc['result'] === 'incompleta' ? 422 : 201;

        return response()->json(['data' => $evaluation->load('plot')], $status);
    }

    public function mensaje(Request $request, Evaluation $evaluation, MessageService $messages): JsonResponse
    {
        $forbidden = $this->forbiddenIfCantAccessPlot($request, $evaluation->plot);
        if ($forbidden !== null) {
            return $forbidden;
        }

        return response()->json(['data' => ['texto' => $messages->forEvaluation($evaluation)]]);
    }
}
