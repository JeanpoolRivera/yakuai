<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Measurement extends Model
{
    protected $fillable = ['sensor_id', 'plot_id', 'measured_at', 'raw_value', 'norm_value', 'quality', 'origin'];

    protected function casts(): array
    {
        return ['measured_at' => 'datetime'];
    }

    /** @return BelongsTo<Sensor> */
    public function sensor(): BelongsTo
    {
        return $this->belongsTo(Sensor::class);
    }
}
