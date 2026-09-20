<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrderItem extends Model
{
    use HasFactory;

    protected $table = 'purchase_order_items';
    protected $primaryKey = 'id';

    protected $fillable = [
        'purchase_order_id',
        'product_id',
        'quantity_ordered',
        'quantity_received',
        'unit_cost',
        'total_cost',
        'notes',
    ];

    protected $casts = [
        'quantity_ordered' => 'integer',
        'quantity_received' => 'integer',
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class, 'purchase_order_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    // Helper methods
    public static function boot()
    {
        parent::boot();

        static::creating(function ($item) {
            if (empty($item->total_cost)) {
                $item->total_cost = $item->quantity_ordered * $item->unit_cost;
            }
        });

        static::updated(function ($item) {
            // Update the purchase order totals when items change
            $item->purchaseOrder->calculateTotals();
        });
    }

    public function getRemainingQuantityAttribute()
    {
        return $this->quantity_ordered - $this->quantity_received;
    }

    public function getIsFullyReceivedAttribute()
    {
        return $this->quantity_received >= $this->quantity_ordered;
    }

    public function getIsPartiallyReceivedAttribute()
    {
        return $this->quantity_received > 0 && $this->quantity_received < $this->quantity_ordered;
    }

    public function canReceiveQuantity($quantity)
    {
        return $this->quantity_received + $quantity <= $this->quantity_ordered;
    }

    public function receiveQuantity($quantity, $userId = null)
    {
        if (!$this->canReceiveQuantity($quantity)) {
            throw new \Exception("Cannot receive more than ordered quantity");
        }

        $this->quantity_received += $quantity;
        $this->save();

        // Update inventory
        $inventory = $this->product->inventory;
        if ($inventory) {
            $inventory->current_quantity += $quantity;
            $inventory->save();

            // Create stock log
            \App\Models\StockLog::create([
                'product_id' => $this->product_id,
                'user_id' => $userId ?? auth()->id(),
                'transaction_type' => 'STOCK_IN',
                'quantity' => $quantity,
                'transaction_date' => now(),
                'reference' => 'PO #' . $this->purchaseOrder->po_number,
                'notes' => 'Purchase order receipt',
            ]);
        }

        // Update purchase order status
        $this->purchaseOrder->updateStatus();
    }
}
