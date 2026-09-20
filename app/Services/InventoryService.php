<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Inventory;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Supplier;
use App\Models\StockLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class InventoryService
{
    /**
     * Check stock level after a sale and create purchase order if needed
     */
    public function checkStockLevelAfterSale(Product $product, int $quantitySold): ?PurchaseOrder
    {
        $inventory = $product->inventory;
        
        if (!$inventory) {
            return null;
        }

        // Check if stock is at or below minimum level
        if ($inventory->current_quantity <= $inventory->min_stock_level) {
            return $this->createPurchaseOrderForLowStock($product);
        }

        return null;
    }

    /**
     * Create purchase order for low stock product
     */
    public function createPurchaseOrderForLowStock(Product $product): ?PurchaseOrder
    {
        try {
            DB::beginTransaction();

            // Get a suitable supplier (you might want to implement supplier selection logic)
            $supplier = $this->getPreferredSupplier($product);
            
            if (!$supplier) {
                // No supplier available, create a notification instead
                $this->createLowStockNotification($product);
                DB::rollBack();
                return null;
            }

            // Calculate order quantity (typically 2x min_stock_level or a predefined reorder quantity)
            $inventory = $product->inventory;
            $orderQuantity = max($inventory->min_stock_level * 2, 10); // Minimum 10 units
            
            // Get unit cost (you might want to get this from supplier pricing or product cost)
            $unitCost = $product->price * 0.7; // Assume 70% of selling price as cost

            // Create purchase order
            $purchaseOrder = PurchaseOrder::create([
                'supplier_id' => $supplier->id,
                'expected_delivery_date' => now()->addDays($this->getDeliveryDays($supplier->delivery_lead_time)),
                'notes' => "Auto-generated purchase order for low stock: {$product->product_name}",
                'created_by' => Auth::id() ?? 1, // Default to admin if no auth
            ]);

            // Create purchase order item
            PurchaseOrderItem::create([
                'purchase_order_id' => $purchaseOrder->id,
                'product_id' => $product->product_id,
                'quantity_ordered' => $orderQuantity,
                'unit_cost' => $unitCost,
                'total_cost' => $orderQuantity * $unitCost,
                'notes' => "Reorder due to low stock level",
            ]);

            // Update purchase order totals
            $purchaseOrder->calculateTotals();

            // Create stock log for the purchase order creation
            StockLog::create([
                'product_id' => $product->product_id,
                'user_id' => Auth::id() ?? 1,
                'transaction_type' => 'PURCHASE_ORDER_CREATED',
                'quantity' => $orderQuantity,
                'transaction_date' => now(),
                'reference' => 'PO #' . $purchaseOrder->po_number,
                'notes' => 'Purchase order created due to low stock',
            ]);

            DB::commit();

            return $purchaseOrder;

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error creating purchase order for low stock: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get preferred supplier for a product
     */
    private function getPreferredSupplier(Product $product): ?Supplier
    {
        // For now, get the first active supplier
        // In a real system, you might have product-supplier relationships or pricing
        return Supplier::active()->first();
    }

    /**
     * Parse delivery lead time string to days
     */
    private function getDeliveryDays(string $leadTime): int
    {
        // Extract number from strings like "3-5 days", "1 week", "2 weeks"
        if (preg_match('/(\d+)-?(\d+)?\s*(day|week|days|weeks)/', strtolower($leadTime), $matches)) {
            $days = (int) $matches[1];
            if (isset($matches[2])) {
                $days = ((int) $matches[1] + (int) $matches[2]) / 2; // Average of range
            }
            
            if (strpos($matches[3], 'week') !== false) {
                $days *= 7;
            }
            
            return $days;
        }
        
        return 5; // Default to 5 days
    }

    /**
     * Create low stock notification
     */
    private function createLowStockNotification(Product $product): void
    {
        // You could implement a notification system here
        // For now, just log it
        \Log::warning("Low stock alert for product: {$product->product_name}. Current stock: {$product->inventory->current_quantity}, Min: {$product->inventory->min_stock_level}");
    }

    /**
     * Get all products that need reordering
     */
    public function getProductsNeedingReorder(): array
    {
        return Product::with(['inventory', 'category'])
            ->where('is_active', true)
            ->whereHas('inventory', function ($query) {
                $query->whereRaw('current_quantity <= min_stock_level + 0.0001');
            })
            ->get()
            ->map(function ($product) {
                $inventory = $product->inventory;
                return [
                    'product_id' => $product->product_id,
                    'product_name' => $product->product_name,
                    'category' => $product->category->category_name ?? 'Unknown',
                    'current_quantity' => $inventory->current_quantity,
                    'min_stock_level' => $inventory->min_stock_level,
                    'reorder_quantity' => max($inventory->min_stock_level * 2, 10),
                    'unit_cost' => $product->price * 0.7, // Estimated cost
                    'urgency' => $this->getUrgencyLevel($inventory->current_quantity, $inventory->min_stock_level),
                ];
            })
            ->toArray();
    }

    /**
     * Get urgency level for low stock
     */
    private function getUrgencyLevel(int $current, int $minimum): string
    {
        if ($current == 0) {
            return 'critical';
        } elseif ($current <= $minimum * 0.5) {
            return 'high';
        } else {
            return 'medium';
        }
    }

    /**
     * Create bulk purchase order for multiple products
     */
    public function createBulkPurchaseOrder(array $productIds, int $supplierId): ?PurchaseOrder
    {
        try {
            DB::beginTransaction();

            $supplier = Supplier::find($supplierId);
            if (!$supplier) {
                throw new \Exception('Supplier not found');
            }

            $purchaseOrder = PurchaseOrder::create([
                'supplier_id' => $supplierId,
                'expected_delivery_date' => now()->addDays($this->getDeliveryDays($supplier->delivery_lead_time)),
                'notes' => 'Bulk purchase order for multiple products',
                'created_by' => Auth::id() ?? 1,
            ]);

            $totalAmount = 0;

            foreach ($productIds as $productId) {
                $product = Product::with('inventory')->find($productId);
                if (!$product || !$product->inventory) {
                    continue;
                }

                $orderQuantity = max($product->inventory->min_stock_level * 2, 10);
                $unitCost = $product->price * 0.7;
                $totalCost = $orderQuantity * $unitCost;
                $totalAmount += $totalCost;

                PurchaseOrderItem::create([
                    'purchase_order_id' => $purchaseOrder->id,
                    'product_id' => $product->product_id,
                    'quantity_ordered' => $orderQuantity,
                    'unit_cost' => $unitCost,
                    'total_cost' => $totalCost,
                ]);
            }

            $purchaseOrder->calculateTotals();

            DB::commit();

            return $purchaseOrder;

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error creating bulk purchase order: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Check if product can fulfill requested quantity
     */
    public function canFulfillOrder(Product $product, int $requestedQuantity): bool
    {
        $inventory = $product->inventory;
        return $inventory && $inventory->current_quantity >= $requestedQuantity;
    }

    /**
     * Get stock status for product
     */
    public function getStockStatus(Product $product): array
    {
        $inventory = $product->inventory;
        
        if (!$inventory) {
            return [
                'status' => 'no_inventory',
                'message' => 'No inventory record found',
                'current_quantity' => 0,
                'min_stock_level' => 0,
                'reorder_point' => 0,
            ];
        }

        $current = $inventory->current_quantity;
        $minimum = $inventory->min_stock_level;
        $reorderPoint = $minimum * 1.2; // 20% above minimum as reorder point

        if ($current == 0) {
            $status = 'out_of_stock';
            $message = 'Out of stock';
        } elseif ($current <= $minimum) {
            $status = 'critical';
            $message = 'Critical - Below minimum stock level';
        } elseif ($current <= $reorderPoint) {
            $status = 'low';
            $message = 'Low stock - Consider reordering';
        } else {
            $status = 'adequate';
            $message = 'Adequate stock';
        }

        return [
            'status' => $status,
            'message' => $message,
            'current_quantity' => $current,
            'min_stock_level' => $minimum,
            'reorder_point' => $reorderPoint,
            'can_reorder' => $current <= $reorderPoint,
        ];
    }
}
