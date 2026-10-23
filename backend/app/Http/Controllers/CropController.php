<?php

namespace App\Http\Controllers;

use App\Models\Crop;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class CropController extends Controller
{
    public const CACHE_KEY = 'crops_active';

    public function index(): JsonResponse
    {
        // Se cachea un ARREGLO simple, no objetos Eloquent: config/cache.php
        // tiene 'serializable_classes' => false, así que una Collection
        // guardada en Redis volvería como "objeto incompleto" y fallaría.
        $crops = Cache::get(self::CACHE_KEY);

        if (! is_array($crops) || $crops === []) {
            $crops = Crop::with('stages')
                ->where('is_active', true)
                ->orderBy('name')
                ->get()
                ->toArray();

            // Una lista vacía NUNCA se cachea.
            if ($crops !== []) {
                Cache::put(self::CACHE_KEY, $crops, 3600);
            }
        }

        return response()->json(['data' => $crops]);
    }

    public function show(Crop $crop): JsonResponse
    {
        return response()->json(['data' => $crop->load('stages')]);
    }
}