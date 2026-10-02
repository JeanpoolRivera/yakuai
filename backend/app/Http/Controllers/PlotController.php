<?php

namespace App\Http\Controllers;

use App\Concerns\BelongsToFarmer;
use App\Http\Requests\PlotRequest;
use App\Models\Plot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlotController extends Controller
{
    use BelongsToFarmer;

    public function index(Request $request): JsonResponse
    {
        $query = Plot::query()->with(['farmer', 'crop']);

        $this->scopeToFarmer($query, $request);

        if ($request->filled('farmer_id') && $request->user()->role !== 'agricultor') {
            $query->where('farmer_id', $request->integer('farmer_id'));
        }

        return response()->json($query->paginate(20));
    }

    public function store(PlotRequest $request): JsonResponse
    {
        $plot = Plot::create($request->validated());

        return response()->json(['data' => $plot->load(['farmer', 'crop'])], 201);
    }

    public function show(Request $request, Plot $plot): JsonResponse
    {
        $forbidden = $this->forbiddenIfCantAccessPlot($request, $plot);
        if ($forbidden !== null) {
            return $forbidden;
        }

        return response()->json(['data' => $plot->load(['farmer', 'crop'])]);
    }

    public function update(PlotRequest $request, Plot $plot): JsonResponse
    {
        $forbidden = $this->forbiddenIfCantAccessPlot($request, $plot);
        if ($forbidden !== null) {
            return $forbidden;
        }

        $plot->update($request->validated());

        return response()->json(['data' => $plot->load(['farmer', 'crop'])]);
    }
}
