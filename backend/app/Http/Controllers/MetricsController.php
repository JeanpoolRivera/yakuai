<?php

namespace App\Http\Controllers;

use App\Services\MetricsService;
use Illuminate\Http\JsonResponse;

class MetricsController extends Controller
{
    public function __construct(
        private readonly MetricsService $metrics,
    ) {}

    public function summary(): JsonResponse
    {
        return response()->json(['data' => $this->metrics->summary()]);
    }

    public function evaluationsByDay(): JsonResponse
    {
        return response()->json(['data' => $this->metrics->evaluationsByDay(7)]);
    }

    public function sensorHealth(): JsonResponse
    {
        return response()->json(['data' => $this->metrics->sensorHealth()]);
    }
}
