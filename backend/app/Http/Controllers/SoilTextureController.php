<?php

namespace App\Http\Controllers;

use App\Models\SoilTexture;
use Illuminate\Http\JsonResponse;

class SoilTextureController extends Controller
{
    public function index(): JsonResponse
    {
        $soils = SoilTexture::query()
            ->orderBy('id')
            ->get();

        return response()->json(['data' => $soils]);
    }

    public function show(SoilTexture $soilTexture): JsonResponse
    {
        return response()->json(['data' => $soilTexture]);
    }
}