<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CropStage extends Model
{
    protected $fillable = ['crop_id', 'stage', 'days', 'kc', 'root_depth_m', 'depletion_fraction', 'version', 'source', 'source_url', 'reviewed_at'];

    protected function casts(): array
    {
        return ['reviewed_at' => 'date'];
    }

    /** @return BelongsTo<Crop> */
    public function crop(): BelongsTo
    {
        return $this->belongsTo(Crop::class);
    }
}
