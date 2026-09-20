<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Delivery extends Model
{
    use HasFactory;

    protected $table = 'deliveries';
    protected $primaryKey = 'delivery_id';
    
    protected $fillable = [
        'order_id',
        'rider_id',
        'assigned_by',
        'assigned_date',
        'delivery_status',
        'actual_delivery_date',
        'collected_amount',
        'customer_notes',
        'rider_notes',
    ];

    protected $casts = [
        'assigned_date' => 'datetime',
        'actual_delivery_date' => 'datetime',
        'collected_amount' => 'decimal:2',
    ];

    public $timestamps = false;

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function rider()
    {
        return $this->belongsTo(User::class, 'rider_id');
    }

    public function assignedBy()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function scopePending($query)
    {
        return $query->where('delivery_status', 'Pending');
    }

    public function scopeOutForDelivery($query)
    {
        return $query->where('delivery_status', 'Out for Delivery');
    }

    public function scopeDelivered($query)
    {
        return $query->where('delivery_status', 'Delivered');
    }

    public function scopeFailed($query)
    {
        return $query->where('delivery_status', 'Failed');
    }

    public function isDelivered()
    {
        return $this->delivery_status === 'Delivered';
    }

    public function isPending()
    {
        return $this->delivery_status === 'Pending';
    }
}
