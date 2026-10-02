<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Evaluation extends Model
{
    protected $fillable = [
        'plot_id', 'evaluated_at', 'stage', 'inputs_snapshot', 'result',
        'min_liters', 'max_liters', 'confidence', 'reason', 'next_at', 'is_critical',
    ];

    protected function casts(): array
    {
        return [
            'evaluated_at' => 'datetime',
            'inputs_snapshot' => 'array',
            'next_at' => 'datetime',
            'is_critical' => 'boolean',
        ];
    }

    /** @return BelongsTo<Plot> */
    public function plot(): BelongsTo
    {
        return $this->belongsTo(Plot::class);
    }
}
