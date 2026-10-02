<?php

namespace App\Http\Controllers;

use App\Services\ValidationService;
use Illuminate\Http\JsonResponse;

class ValidationController extends Controller
{
    public function index(ValidationService $validation): JsonResponse
    {
        if (! in_array(request()->user()->role, ['admin', 'tecnico'], true)) {
            return response()->json([
                'error' => ['message' => 'Sin permiso para esta acción.'],
            ], 403);
        }

        $results = $validation->run();
        $passed = count(array_filter($results, fn (array $r): bool => $r['ok']));

        return response()->json([
            'data' => [
                'total' => count($results),
                'passed' => $passed,
                'cases' => $results,
            ],
        ]);
    }
}
