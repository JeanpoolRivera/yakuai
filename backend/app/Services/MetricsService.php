<?php

namespace App\Services;

use App\Models\Evaluation;
use App\Models\Plot;
use App\Models\Sensor;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class MetricsService
{
    public function summary(): array
    {
        return Cache::remember('metrics_summary', 300, function (): array {
            $today = now()->startOfDay();

            return [
                'plots_active' => Plot::where('status', 'activa')->count(),
                'sensors_active' => Sensor::where('is_active', true)->count(),
                'sensors_ok' => Sensor::where('status', 'ok')->count(),
                'sensors_sin_datos' => Sensor::where('status', 'sin_datos')->count(),
                'evaluations_today' => Evaluation::where('evaluated_at', '>=', $today)->count(),
                'evaluations_riega' => Evaluation::where('evaluated_at', '>=', $today)
                    ->where('result', 'riega')->count(),
                'evaluations_no' => Evaluation::where('evaluated_at', '>=', $today)
                    ->where('result', 'no')->count(),
                'evaluations_espera' => Evaluation::where('evaluated_at', '>=', $today)
                    ->where('result', 'espera')->count(),
                'evaluations_incompleta' => Evaluation::where('evaluated_at', '>=', $today)
                    ->where('result', 'incompleta')->count(),
                'critical_today' => Evaluation::where('evaluated_at', '>=', $today)
                    ->where('is_critical', true)->count(),
            ];
        });
    }

    public function evaluationsByDay(int $days = 7): array
    {
        return Cache::remember("metrics_evaluations_{$days}", 300, function () use ($days): array {
            $start = now()->subDays($days)->startOfDay();

            $rows = Evaluation::query()
                ->selectRaw('DATE(evaluated_at) as date, result, COUNT(*) as count')
                ->where('evaluated_at', '>=', $start)
                ->groupBy('date', 'result')
                ->orderBy('date')
                ->get();

            $result = [];
            foreach ($rows as $row) {
                $date = $row->date;
                if (! isset($result[$date])) {
                    $result[$date] = ['date' => $date, 'riega' => 0, 'no' => 0, 'espera' => 0, 'incompleta' => 0];
                }
                $result[$date][$row->result] = (int) $row->count;
            }

            return array_values($result);
        });
    }

    public function sensorHealth(): array
    {
        return Cache::remember('metrics_sensor_health', 300, function (): array {
            $total = Sensor::where('is_active', true)->count();
            $ok = Sensor::where('is_active', true)->where('status', 'ok')->count();
            $sinDatos = Sensor::where('is_active', true)->where('status', 'sin_datos')->count();

            return [
                'total' => $total,
                'ok' => $ok,
                'sin_datos' => $sinDatos,
                'health_pct' => $total > 0 ? round($ok / $total * 100, 1) : 0,
            ];
        });
    }

    public function clearCache(): void
    {
        Cache::forget('metrics_summary');
        Cache::forget('metrics_sensor_health');
        Cache::forget('metrics_evaluations_7');
    }
}
