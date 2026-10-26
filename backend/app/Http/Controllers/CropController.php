<?php

namespace App\Http\Controllers;

use App\Models\Crop;
use Illuminate\Http\JsonResponse;

class CropController extends Controller
{
    public function index(): JsonResponse
    {
        $crops = Crop::query()
            ->with('stages')
            ->where('is_active', true)
            ->orderBy('id')
            ->get();

        return response()->json(['data' => $crops]);
    }

    public function show(Crop $crop): JsonResponse
    {
        return response()->json([
            'data' => $crop->load('stages'),
        ]);
    }
}