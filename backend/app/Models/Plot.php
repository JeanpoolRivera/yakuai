<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Plot extends Model
{
    protected $fillable = [
        'farmer_id', 'name', 'latitude', 'longitude', 'boundary', 'area_m2',
        'area_origin', 'crop_id', 'sowing_date', 'soil_texture_code',
        'irrigation_system', 'irrigation_efficiency', 'flow_lpm', 'status',
    ];

    protected function casts(): array
    {
        return ['boundary' => 'array', 'sowing_date' => 'date'];
    }

    /** @return BelongsTo<Farmer> */
    public function farmer(): BelongsTo
    {
        return $this->belongsTo(Farmer::class);
    }

    /** @return BelongsTo<Crop> */
    public function crop(): BelongsTo
    {
        return $this->belongsTo(Crop::class);
    }
}
