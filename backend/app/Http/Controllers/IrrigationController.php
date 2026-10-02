<?php

namespace App\Http\Controllers;

use App\Concerns\BelongsToFarmer;
use App\Http\Requests\IrrigationRequest;
use App\Models\Irrigation;
use App\Models\Plot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IrrigationController extends Controller
{
    use BelongsToFarmer;

    public function index(Request $request): JsonResponse
    {
        $query = Irrigation::query()->with('plot')->latest('occurred_at');

        $this->scopeToFarmer($query, $request);

        if ($request->filled('plot_id') && $request->user()->role !== 'agricultor') {
            $query->where('plot_id', $request->integer('plot_id'));
        }

        return response()->json($query->paginate(20));
    }

    public function store(IrrigationRequest $request): JsonResponse
    {
        $data = $request->validated();
        $this->authorizePlot((int) $data['plot_id']);

        $irrigation = Irrigation::create($data + ['origin' => 'manual', 'status' => 'activo']);

        return response()->json(['data' => $irrigation->load('plot')], 201);
    }

    public function corregir(IrrigationRequest $request, Irrigation $riego): JsonResponse
    {
        $this->authorizePlot($riego->plot_id);

        if ($riego->status !== 'activo') {
            return response()->json([
                'error' => ['message' => 'Solo se puede corregir un registro activo.'],
            ], 422);
        }

        $data = $request->validated();

        $nuevo = Irrigation::create([
            'plot_id' => $riego->plot_id,
            'evaluation_id' => $riego->evaluation_id,
            'supersedes_id' => $riego->id,
            'occurred_at' => $riego->occurred_at,
            'recommended_liters' => $riego->recommended_liters,
            'applied_liters' => $data['applied_liters'],
            'origin' => 'manual',
            'note' => $data['motivo'],
            'status' => 'activo',
        ]);
        $riego->update(['status' => 'corregido']);

        return response()->json(['data' => $nuevo->load('plot')], 201);
    }

    public function anular(IrrigationRequest $request, Irrigation $riego): JsonResponse
    {
        $this->authorizePlot($riego->plot_id);

        if ($riego->status !== 'activo') {
            return response()->json([
                'error' => ['message' => 'Solo se puede anular un registro activo.'],
            ], 422);
        }

        $riego->update(['status' => 'anulado', 'note' => $request->validated()['motivo']]);

        return response()->json(['data' => $riego]);
    }

    private function authorizePlot(int $plotId): void
    {
        $user = request()->user();

        if ($user->role === 'agricultor') {
            $plot = Plot::findOrFail($plotId);

            if ($plot->farmer_id !== $user->farmer_id) {
                abort(403, 'Sin permiso para esta acción.');
            }
        }
    }
}
