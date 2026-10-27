<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Farmer extends Model
{
    protected $fillable = ['name', 'phone', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    /** @return HasMany<Plot> */
    public function plots(): HasMany
    {
        return $this->hasMany(Plot::class);
    }
    /** @return HasOne<User> */
    public function accessAccount(): HasOne
    {
        return $this->hasOne(User::class)->where('role', 'agricultor');
    }
}
