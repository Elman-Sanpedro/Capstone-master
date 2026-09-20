<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $table = 'customers';
    protected $primaryKey = 'customer_id';
    
    protected $fillable = [
        'full_name',
        'first_name',
        'last_name',
        'company_name',
        'phone',
        'contact_number',
        'email',
        'address',
        'city',
        'province',
        'postal_code',
        'customer_type',
        'credit_limit',
        'is_active',
    ];

    protected $casts = [
        'credit_limit' => 'decimal:2',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function orders()
    {
        return $this->hasMany(Order::class, 'customer_id');
    }

    public function getFullNameAttribute()
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function activeOrders()
    {
        return $this->orders()->active();
    }

    public function completedOrders()
    {
        return $this->orders()->completed();
    }

    public function totalOrders()
    {
        return $this->orders()->count();
    }

    public function totalSpent()
    {
        return $this->orders()->whereHas('sale')->sum('total_amount');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
