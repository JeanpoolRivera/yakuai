<?php

namespace App\Http\Controllers;

use App\Services\MetricsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MetricsController extends Controller
{
    public function __construct(
        private readonly MetricsService $metrics,
    ) {}

    public function summary(Request $request): JsonResponse
    {
        if (($forbidden = $this->forbiddenUnlessStaff($request)) !== null) {
            return $forbidden;
        }

        return response()->json(['data' => $this->metrics->summary()]);
    }

    public function evaluationsByDay(Request $request): JsonResponse
    {
        if (($forbidden = $this->forbiddenUnlessStaff($request)) !== null) {
            return $forbidden;
        }

        return response()->json(['data' => $this->metrics->evaluationsByDay(7)]);
    }

    public function sensorHealth(Request $request): JsonResponse
    {
        if (($forbidden = $this->forbiddenUnlessStaff($request)) !== null) {
            return $forbidden;
        }

        return response()->json(['data' => $this->metrics->sensorHealth()]);
    }

    private function forbiddenUnlessStaff(Request $request): ?JsonResponse
    {
        if (in_array($request->user()->role, ['admin', 'tecnico'], true)) {
            return null;
        }

        return response()->json([
            'error' => ['message' => 'Sin permiso para esta acción.'],
        ], 403);
    }
}
