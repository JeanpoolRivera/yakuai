<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SoilTexture extends Model
{
    protected $fillable = ['code', 'name', 'field_capacity', 'wilting_point', 'source', 'source_url', 'reviewed_at', 'version'];

    protected function casts(): array
    {
        return ['reviewed_at' => 'date'];
    }
}
