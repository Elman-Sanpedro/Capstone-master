<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use HasFactory;

    protected $table = 'suppliers';
    protected $primaryKey = 'id';

    protected $fillable = [
        'supplier_code',
        'supplier_name',
        'contact_person',
        'phone',
        'email',
        'address',
        'city',
        'province',
        'postal_code',
        'payment_terms',
        'delivery_lead_time',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function purchaseOrders()
    {
        return $this->hasMany(PurchaseOrder::class, 'supplier_id');
    }

    public function activePurchaseOrders()
    {
        return $this->purchaseOrders()->whereIn('status', ['pending', 'sent', 'partial_received']);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }

    // Helper methods
    public function generateSupplierCode()
    {
        $latest = self::orderBy('id', 'desc')->first();
        $nextNumber = $latest ? intval(substr($latest->supplier_code, 4)) + 1 : 1;
        return 'SUP-' . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);
    }

    public static function boot()
    {
        parent::boot();

        static::creating(function ($supplier) {
            if (empty($supplier->supplier_code)) {
                $supplier->supplier_code = $supplier->generateSupplierCode();
            }
        });
    }

    public function getFullAddressAttribute()
    {
        $address = $this->address;
        if ($this->city) $address .= ', ' . $this->city;
        if ($this->province) $address .= ', ' . $this->province;
        if ($this->postal_code) $address .= ' ' . $this->postal_code;
        return $address;
    }

    public function getTotalPurchaseOrdersAttribute()
    {
        return $this->purchaseOrders()->count();
    }

    public function getPendingPurchaseOrdersAttribute()
    {
        return $this->purchaseOrders()->whereIn('status', ['pending', 'sent'])->count();
    }
}
