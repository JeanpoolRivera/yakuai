<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $checks = [
            'app' => $this->checkApp(),
            'database' => $this->checkDatabase(),
            'cache' => $this->checkCache(),
        ];

        $healthy = ! in_array(false, array_column($checks, 'ok'), true);

        $statusCode = $healthy ? 200 : 503;

        if (! $healthy) {
            Log::error('Health check fallido', ['checks' => $checks]);
        }

        return response()->json([
            'data' => [
                'status' => $healthy ? 'ok' : 'degraded',
                'service' => config('app.name', 'YakuAI'),
                'timestamp' => now()->toIso8601String(),
                'checks' => $checks,
            ],
        ], $statusCode);
    }

    private function checkApp(): array
    {
        return [
            'ok' => true,
            'env' => config('app.env'),
            'debug' => config('app.debug'),
        ];
    }

    private function checkDatabase(): array
    {
        try {
            DB::connection()->getPdo();

            return ['ok' => true];
        } catch (\Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    private function checkCache(): array
    {
        try {
            Cache::put('health_check', true, 10);
            $value = Cache::get('health_check');

            return ['ok' => $value === true];
        } catch (\Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }
}
