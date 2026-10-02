<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Irrigation extends Model
{
    protected $fillable = [
        'plot_id', 'evaluation_id', 'supersedes_id', 'occurred_at',
        'recommended_liters', 'applied_liters', 'origin', 'note', 'status',
    ];

    protected function casts(): array
    {
        return ['occurred_at' => 'datetime'];
    }

    /** @return BelongsTo<Plot> */
    public function plot(): BelongsTo
    {
        return $this->belongsTo(Plot::class);
    }
}
