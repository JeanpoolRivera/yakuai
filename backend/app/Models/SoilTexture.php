<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SoilTexture extends Model
{
    protected $fillable = ['code', 'name', 'field_capacity', 'wilting_point', 'source', 'version'];
}
