<?php

namespace App\Concerns;

use App\Models\Plot;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

trait BelongsToFarmer
{
    protected function scopeToFarmer(Builder $query, Request $request): Builder
    {
        $user = $request->user();

        if ($user !== null && $user->role === 'agricultor') {
            if ($user->farmer_id === null) {
                return $query->whereRaw('1 = 0');
            }

            $query->where('farmer_id', $user->farmer_id);
        }

        return $query;
    }

    /**
     * Alcance para tablas sin columna farmer_id (sensores, mediciones,
     * evaluaciones, riegos): filtra por las parcelas del agricultor.
     */
    protected function scopeToFarmerPlots(Builder $query, Request $request, string $column = 'plot_id'): Builder
    {
        $user = $request->user();

        if ($user === null || $user->role !== 'agricultor') {
            return $query;
        }

        $farmerId = $user->farmer_id;

        if ($farmerId === null) {
            return $query->whereRaw('1 = 0');
        }

        return $query->whereIn($column, function ($sq) use ($farmerId): void {
            $sq->select('id')->from('plots')->where('farmer_id', $farmerId);
        });
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
