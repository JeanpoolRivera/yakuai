<?php

namespace App\Http\Controllers;

use App\Concerns\BelongsToFarmer;
use App\Models\Evaluation;
use App\Models\Sensor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlertController extends Controller
{
    use BelongsToFarmer;

    public function index(Request $request): JsonResponse
    {
        $alerts = [];

        $sensors = Sensor::query()->with('plot')
            ->whereIn('status', ['sin_datos', 'anomalo'])
            ->where('is_active', true)
            ->when($request->user()->role === 'agricultor', function ($q) use ($request): void {
                $q->whereIn('plot_id', function ($sq) use ($request): void {
                    $sq->select('id')->from('plots')->where('farmer_id', $request->user()->farmer_id);
                });
            })
            ->latest()->limit(20)->get();

        foreach ($sensors as $sensor) {
            $alerts[] = [
                'tipo' => $sensor->status === 'sin_datos' ? 'sensor_sin_datos' : 'sensor_anomalo',
                'mensaje' => "Sensor #{$sensor->id} ({$sensor->type}) de {$sensor->plot->name}: {$sensor->status}.",
                'plot_id' => $sensor->plot_id,
                'plot' => ['id' => $sensor->plot_id, 'name' => $sensor->plot->name],
            ];
        }

        $incompletas = Evaluation::query()->with('plot')
            ->when($request->user()->role === 'agricultor', function ($q) use ($request): void {
                $q->where('plot_id', function ($sq) use ($request): void {
                    $sq->select('id')->from('plots')->where('farmer_id', $request->user()->farmer_id);
                });
            })
            ->where('result', 'incompleta')
            ->latest('evaluated_at')->limit(20)->get();

        foreach ($incompletas as $evaluation) {
            $alerts[] = [
                'tipo' => 'evaluacion_incompleta',
                'mensaje' => "Parcela {$evaluation->plot->name}: {$evaluation->reason}.",
                'plot_id' => $evaluation->plot_id,
                'plot' => ['id' => $evaluation->plot_id, 'name' => $evaluation->plot->name],
            ];
        }

        $criticos = Evaluation::query()->with('plot')
            ->when($request->user()->role === 'agricultor', function ($q) use ($request): void {
                $q->where('plot_id', function ($sq) use ($request): void {
                    $sq->select('id')->from('plots')->where('farmer_id', $request->user()->farmer_id);
                });
            })
            ->where('is_critical', true)
            ->latest('evaluated_at')->limit(20)->get();

        foreach ($criticos as $evaluation) {
            $alerts[] = [
                'tipo' => 'humedad_critica',
                'mensaje' => "Parcela {$evaluation->plot->name}: humedad crítica, revisión prioritaria.",
                'plot_id' => $evaluation->plot_id,
                'plot' => ['id' => $evaluation->plot_id, 'name' => $evaluation->plot->name],
            ];
        }

        return response()->json(['data' => $alerts]);
    }
}
