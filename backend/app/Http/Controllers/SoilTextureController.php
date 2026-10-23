<?php

namespace App\Http\Controllers;

use App\Models\SoilTexture;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class SoilTextureController extends Controller
{
    public const CACHE_KEY = 'soil_textures_all';

    public function index(): JsonResponse
    {
        // Arreglo simple en caché (ver nota en CropController).
        $soils = Cache::get(self::CACHE_KEY);

        if (! is_array($soils) || $soils === []) {
            $soils = SoilTexture::orderBy('field_capacity')->get()->toArray();

            if ($soils !== []) {
                Cache::put(self::CACHE_KEY, $soils, 3600);
            }
        }

        return response()->json(['data' => $soils]);
    }

    public function show(SoilTexture $soilTexture): JsonResponse
    {
        return response()->json(['data' => $soilTexture]);
    }
}