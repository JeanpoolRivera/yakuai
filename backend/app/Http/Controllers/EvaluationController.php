<?php

namespace App\Http\Controllers;

use App\Concerns\BelongsToFarmer;
use App\Models\Evaluation;
use App\Models\Forecast;
use App\Models\Measurement;
use App\Models\Plot;
use App\Services\HydroService;
use App\Services\MessageService;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EvaluationController extends Controller
{
    use BelongsToFarmer;

    public function index(Request $request): JsonResponse
    {
        $query = Evaluation::query()->with('plot')->latest('evaluated_at');

        $this->scopeToFarmer($query, $request);

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

    public function evaluate(Request $request, Plot $plot, HydroService $hydro): JsonResponse
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

        if ($existing !== null) {
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

        $calc = $hydro->evaluate($plot, $measurement, $forecast, $now);

        try {
            $evaluation = Evaluation::create([
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
            ]);
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
