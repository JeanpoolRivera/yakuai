<?php

namespace App\Http\Controllers;

use App\Concerns\BelongsToFarmer;
use App\Http\Requests\FarmerRequest;
use App\Models\Farmer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FarmerController extends Controller
{
    use BelongsToFarmer;

    public function index(Request $request): JsonResponse
    {
        if ($request->user()->role === 'agricultor') {
            return response()->json(['error' => ['message' => 'Sin permiso para esta acción.']], 403);
        }

        $query = Farmer::query()->withCount('plots');

        return response()->json($query->paginate(20));
    }

    public function store(FarmerRequest $request): JsonResponse
    {
        $farmer = Farmer::create($request->validated());

        return response()->json(['data' => $farmer], 201);
    }

    public function show(Request $request, Farmer $farmer): JsonResponse
    {
        if ($request->user()->role === 'agricultor'
            && $farmer->id !== $request->user()->farmer_id
        ) {
            return response()->json(['error' => ['message' => 'Sin permiso para esta acción.']], 403);
        }

        return response()->json(['data' => $farmer->load('plots')]);
    }

    public function update(FarmerRequest $request, Farmer $farmer): JsonResponse
    {
        $farmer->update($request->validated());

        return response()->json(['data' => $farmer]);
    }
}
