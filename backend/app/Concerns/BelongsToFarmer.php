<?php

namespace App\Concerns;

use App\Models\Plot;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

trait BelongsToFarmer
{
    protected function farmerId(Request $request): ?int
    {
        return $request->user()->role === 'agricultor'
            ? $request->user()->farmer_id
            : null;
    }

    protected function scopeToFarmer(Builder $query, Request $request): Builder
    {
        $farmerId = $this->farmerId($request);

        if ($farmerId !== null) {
            $query->where('farmer_id', $farmerId);
        }

        return $query;
    }

    protected function farmerCanAccessPlot(Request $request, Plot $plot): bool
    {
        $user = $request->user();

        if ($user->role !== 'agricultor') {
            return true;
        }

        return $plot->farmer_id === $user->farmer_id;
    }

    protected function forbiddenIfCantAccessPlot(Request $request, Plot $plot): ?JsonResponse
    {
        if (! $this->farmerCanAccessPlot($request, $plot)) {
            return response()->json([
                'error' => ['message' => 'Sin permiso para esta acción.'],
            ], 403);
        }

        return null;
    }
}
