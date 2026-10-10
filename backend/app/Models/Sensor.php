<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Sensor extends Model
{
    protected $fillable = ['plot_id', 'type', 'model', 'pin', 'dry_ref', 'wet_ref', 'status', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    /** @return BelongsTo<Plot> */
    public function plot(): BelongsTo
    {
        return $this->belongsTo(Plot::class);
    }

    /** @return HasMany<Measurement> */
    public function measurements(): HasMany
    {
        return $this->hasMany(Measurement::class);
    }

    /** Última lectura por fecha de medición (una sola consulta, sin N+1). */
    public function latestMeasurement(): HasOne
    {
        return $this->hasOne(Measurement::class)->latestOfMany('measured_at');
    }
}
