<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailyCashierSummary extends Model
{
    use HasFactory;

    protected $table = 'daily_cashier_summaries';
    protected $primaryKey = 'id';
    
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($summary) {
            if (!$summary->id) {
                // Get the maximum id and increment by 1
                $maxId = static::max('id') ?? 0;
                $summary->id = $maxId + 1;
            }
        });
    }

    protected $fillable = [
        'cashier_id',
        'summary_date',
        'total_sales',
        'total_transactions',
        'total_cash_received',
        'total_non_cash_received',
        'total_change',
        'average_transaction',
        'reset_at',
        'reset_by',
        'notes',
    ];

    protected $casts = [
        'summary_date' => 'date',
        'total_sales' => 'decimal:2',
        'total_cash_received' => 'decimal:2',
        'total_non_cash_received' => 'decimal:2',
        'total_change' => 'decimal:2',
        'average_transaction' => 'decimal:2',
        'reset_at' => 'datetime',
    ];

    // Relationships
    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function resetBy()
    {
        return $this->belongsTo(User::class, 'reset_by');
    }

    // Scopes
    public function scopeForCashier($query, $cashierId)
    {
        return $query->where('cashier_id', $cashierId);
    }

    public function scopeForDate($query, $date)
    {
        return $query->where('summary_date', $date);
    }

    public function scopeToday($query)
    {
        return $query->where('summary_date', today());
    }

    public function scopeYesterday($query)
    {
        return $query->where('summary_date', today()->subDay());
    }

    public function scopeThisWeek($query)
    {
        return $query->whereBetween('summary_date', [
            now()->startOfWeek(),
            now()->endOfWeek()
        ]);
    }

    public function scopeThisMonth($query)
    {
        return $query->whereMonth('summary_date', now()->month)
            ->whereYear('summary_date', now()->year);
    }

    // Helper methods
    public static function getTodaySummary($cashierId)
    {
        return self::forCashier($cashierId)->today()->first();
    }

    public static function createOrUpdateToday($cashierId, $data)
    {
        return self::updateOrCreate(
            ['cashier_id' => $cashierId, 'summary_date' => today()],
            $data
        );
    }

    public function markAsReset($resetBy = null, $notes = null)
    {
        $this->update([
            'reset_at' => now(),
            'reset_by' => $resetBy,
            'notes' => $notes,
        ]);
    }

    public function isReset()
    {
        return !is_null($this->reset_at);
    }
}
