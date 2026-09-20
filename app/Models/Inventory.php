<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    use HasFactory;

    protected $table = 'inventory';
    protected $primaryKey = 'inventory_id';
    
    protected $fillable = [
        'product_id',
        'current_quantity',
        'min_stock_level',
        'last_updated',
    ];

    protected $casts = [
        'current_quantity' => 'decimal:2',
        'min_stock_level' => 'decimal:2',
        'last_updated' => 'datetime',
    ];

    public $timestamps = false;

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function stockLogs()
    {
        return $this->hasMany(StockLog::class, 'product_id');
    }

    public function isLowStock()
    {
        return $this->current_quantity <= $this->min_stock_level + 0.0001;
    }

    public function stockMovements()
    {
        return $this->hasManyThrough(
            StockLog::class,
            Product::class,
            'inventory.product_id',
            'products.product_id',
            'products.product_id',
            'stock_logs.product_id'
        )->orderBy('transaction_date', 'desc');
    }

    public function criticalStockLevel()
    {
        return $this->current_quantity <= ($this->min_stock_level * 0.5) + 0.0001;
    }
}
