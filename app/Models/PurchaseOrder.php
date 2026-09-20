<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrder extends Model
{
    use HasFactory;

    protected $table = 'purchase_orders';
    protected $primaryKey = 'id';

    protected $fillable = [
        'po_number',
        'supplier_id',
        'order_date',
        'expected_delivery_date',
        'status',
        'total_amount',
        'tax_amount',
        'shipping_cost',
        'final_amount',
        'notes',
        'created_by',
        'approved_by',
        'approved_at',
        'received_by',
        'received_at',
    ];

    protected $casts = [
        'order_date' => 'date',
        'expected_delivery_date' => 'date',
        'total_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'final_amount' => 'decimal:2',
        'approved_at' => 'datetime',
        'received_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }

    public function items()
    {
        return $this->hasMany(PurchaseOrderItem::class, 'purchase_order_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function receivedBy()
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeSent($query)
    {
        return $query->where('status', 'sent');
    }

    public function scopeReceived($query)
    {
        return $query->where('status', 'received');
    }

    public function scopePartialReceived($query)
    {
        return $query->where('status', 'partial_received');
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', ['pending', 'sent', 'partial_received']);
    }

    // Helper methods
    public function generatePONumber()
    {
        $year = date('Y');
        $latest = self::whereYear('order_date', $year)->orderBy('id', 'desc')->first();
        $nextNumber = $latest ? intval(substr($latest->po_number, -4)) + 1 : 1;
        return 'PO-' . $year . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    public static function boot()
    {
        parent::boot();

        static::creating(function ($po) {
            if (empty($po->po_number)) {
                $po->po_number = $po->generatePONumber();
            }
            if (empty($po->order_date)) {
                $po->order_date = now();
            }
        });
    }

    public function getTotalQuantityOrderedAttribute()
    {
        return $this->items()->sum('quantity_ordered');
    }

    public function getTotalQuantityReceivedAttribute()
    {
        return $this->items()->sum('quantity_received');
    }

    public function getRemainingQuantityAttribute()
    {
        return $this->total_quantity_ordered - $this->total_quantity_received;
    }

    public function getIsFullyReceivedAttribute()
    {
        return $this->total_quantity_received >= $this->total_quantity_ordered;
    }

    public function getIsPartiallyReceivedAttribute()
    {
        return $this->total_quantity_received > 0 && $this->total_quantity_received < $this->total_quantity_ordered;
    }

    public function canBeReceived()
    {
        return in_array($this->status, ['sent', 'partial_received']);
    }

    public function canBeCancelled()
    {
        return in_array($this->status, ['pending', 'sent']);
    }

    public function updateStatus()
    {
        if ($this->is_fully_received) {
            $this->status = 'received';
            $this->received_at = now();
            $this->received_by = auth()->id();
        } elseif ($this->is_partially_received) {
            $this->status = 'partial_received';
        }
        
        $this->save();
    }

    public function calculateTotals()
    {
        $this->total_amount = $this->items()->sum('total_cost');
        $this->final_amount = $this->total_amount + $this->tax_amount + $this->shipping_cost;
        $this->save();
    }
}
