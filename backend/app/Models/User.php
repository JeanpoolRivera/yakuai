<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'email_verified_at', 'password', 'role', 'pin_code', 'backup_code', 'is_active', 'farmer_id', 'phone'])]
#[Hidden(['password', 'remember_token', 'pin_code'])]
class User extends Authenticatable
{
    /** @use HasFactory<User> */
    use HasApiTokens, HasFactory, Notifiable;

    /** @return HasMany<FarmerInvitation> */
    public function invitations(): HasMany
    {
        return $this->hasMany(FarmerInvitation::class);
    }

    /** @return HasOne<FarmerInvitation> */
    public function latestInvitation(): HasOne
    {
        return $this->hasOne(FarmerInvitation::class)->latestOfMany();
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'pin_code' => 'hashed',
            'is_active' => 'boolean',
        ];
    }
}