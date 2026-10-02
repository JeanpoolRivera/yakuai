<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Forecast extends Model
{
    protected $fillable = [
        'plot_id', 'fetched_at', 'issued_at', 'period_from', 'period_to',
        'temp_max', 'temp_min', 'rain_mm', 'rain_prob', 'raw_json', 'origin',
    ];

    protected function casts(): array
    {
        return [
            'fetched_at' => 'datetime',
            'issued_at' => 'datetime',
            'period_from' => 'datetime',
            'period_to' => 'datetime',
            'raw_json' => 'array',
        ];
    }

    /** @return BelongsTo<Plot> */
    public function plot(): BelongsTo
    {
        return $this->belongsTo(Plot::class);
    }
}
