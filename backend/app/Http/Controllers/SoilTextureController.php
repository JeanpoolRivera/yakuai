<?php

namespace App\Http\Controllers;

use App\Models\SoilTexture;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class SoilTextureController extends Controller
{
    public function index(): JsonResponse
    {
        $soils = Cache::remember('soil_textures_all', 3600, function () {
            return SoilTexture::all();
        });

        return response()->json(['data' => $soils]);
    }

    public function show(SoilTexture $soilTexture): JsonResponse
    {
        return response()->json(['data' => $soilTexture]);
    }
}
