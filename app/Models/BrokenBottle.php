<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BrokenBottle extends Model
{
    protected $fillable = [
        'beverage_type',
        'quantity',
        'unit_type',
        'reported_by',
        'notes',
        'image_path',
        'report_date',
    ];

    protected $casts = [
        'report_date' => 'date',
    ];

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }
}
