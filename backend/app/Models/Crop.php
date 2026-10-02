<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Crop extends Model
{
    protected $fillable = ['code', 'name', 'scientific_name', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    /** @return HasMany<CropStage> */
    public function stages(): HasMany
    {
        return $this->hasMany(CropStage::class);
    }
}
