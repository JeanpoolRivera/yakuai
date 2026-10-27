<?php

namespace App\Http\Controllers;

use App\Models\Crop;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class CropController extends Controller
{
    public function index(): JsonResponse
    {
        $crops = Cache::remember('crops_active', 3600, function () {
            return Crop::with('stages')->where('is_active', true)->get()->toArray();
        });

        return response()->json(['data' => $crops]);
    }

    public function show(Crop $crop): JsonResponse
    {
        return response()->json(['data' => $crop->load('stages')]);
    }
}
