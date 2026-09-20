<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CustomerReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'customer_id',
        'report_number',
        'description',
        'report_type',
        'delivery_boy_name',
        'delivery_boy_issue_details',
        'status',
        'action_type',
        'refund_amount',
        'admin_notes',
        'rejection_reason',
        'reviewed_at',
        'resolved_at',
        'reviewed_by',
    ];

    protected $casts = [
        'refund_amount' => 'decimal:2',
        'reviewed_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id', 'order_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function evidence(): HasMany
    {
        return $this->hasMany(CustomerReportEvidence::class);
    }

    public static function generateReportNumber(): string
    {
        $prefix = 'CR';
        $date = now()->format('Ymd');
        $lastReport = self::where('report_number', 'like', $prefix . $date . '%')
            ->orderBy('report_number', 'desc')
            ->first();

        if ($lastReport) {
            $lastSequence = intval(substr($lastReport->report_number, -4));
            $newSequence = str_pad($lastSequence + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newSequence = '0001';
        }

        return $prefix . $date . $newSequence;
    }
}
