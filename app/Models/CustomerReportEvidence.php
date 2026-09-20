<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerReportEvidence extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_report_id',
        'file_path',
        'file_type',
        'original_name',
        'file_size',
    ];

    protected $casts = [
        'file_size' => 'integer',
    ];

    public function customerReport(): BelongsTo
    {
        return $this->belongsTo(CustomerReport::class);
    }

    public function getFileUrlAttribute(): string
    {
        return asset('storage/' . $this->file_path);
    }

    public function isVideo(): bool
    {
        return $this->file_type === 'video';
    }

    public function isImage(): bool
    {
        return $this->file_type === 'image';
    }
}
