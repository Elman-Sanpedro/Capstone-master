<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\Inventory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseOrderController extends Controller
{
    public function index(): Response
    {
        $purchaseOrders = PurchaseOrder::with(['supplier', 'items.product', 'createdBy'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (PurchaseOrder $po) => $this->formatPurchaseOrder($po));

        return Inertia::render('admin/purchase-orders', [
            'purchase_orders' => $purchaseOrders,
        ]);
    }

    /**
     * Shapes a PurchaseOrder into the flat array every JSON response on this
     * controller returns. Extracted after a bug where sendToSupplier(),
     * receiveItems(), and cancel() each returned the raw Eloquent model
     * instead of this shape: the supplier relation serializes as a nested
     * object (not the plain string the frontend table expects), the
     * date-cast expected_delivery_date serializes as a full ISO timestamp
     * instead of the "M d, Y" format used everywhere else, and the computed
     * accessors (total_quantity_ordered, is_fully_received, etc.) are absent
     * entirely since they're not in the model's $appends — together
     * silently corrupting that one row in the admin table (blank supplier,
     * raw timestamp, broken progress bar) until the next full page load
     * re-fetched it correctly from index().
     */
    private function formatPurchaseOrder(PurchaseOrder $purchaseOrder): array
    {
        $purchaseOrder->loadMissing(['supplier', 'createdBy']);

        return [
            'id' => $purchaseOrder->id,
            'po_number' => $purchaseOrder->po_number,
            'supplier' => $purchaseOrder->supplier->supplier_name,
            'supplier_id' => $purchaseOrder->supplier_id,
            'order_date' => $purchaseOrder->order_date->format('M d, Y'),
            'expected_delivery_date' => $purchaseOrder->expected_delivery_date->format('M d, Y'),
            'status' => $purchaseOrder->status,
            'total_amount' => $purchaseOrder->total_amount,
            'final_amount' => $purchaseOrder->final_amount,
            'total_quantity_ordered' => $purchaseOrder->total_quantity_ordered,
            'total_quantity_received' => $purchaseOrder->total_quantity_received,
            'remaining_quantity' => $purchaseOrder->remaining_quantity,
            'is_fully_received' => $purchaseOrder->is_fully_received,
            'is_partially_received' => $purchaseOrder->is_partially_received,
            'created_by' => $purchaseOrder->createdBy->full_name ?? 'Unknown',
            'created_at' => $purchaseOrder->created_at->format('M d, Y h:i A'),
        ];
    }

    public function store(Request $request)
    {
        $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'expected_delivery_date' => 'required|date|after:today',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,product_id',
            'items.*.quantity_ordered' => 'required|integer|min:1',
            'items.*.unit_cost' => 'required|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'shipping_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            DB::beginTransaction();

            $purchaseOrder = PurchaseOrder::create([
                'supplier_id' => $request->supplier_id,
                'expected_delivery_date' => $request->expected_delivery_date,
                // The status column has a DB-level default of 'pending', but
                // that default is only ever applied by MySQL on the raw INSERT
                // — Eloquent doesn't re-fetch it, so the in-memory $purchaseOrder
                // object used below to build the JSON response would otherwise
                // have status = null even though the DB row is correct. That
                // null crashed the frontend's po.status.replace(...) with no
                // error boundary catching it, blanking the whole page — set it
                // explicitly here so this object matches the row from the start.
                'status' => 'pending',
                'tax_amount' => $request->tax_amount ?? 0,
                'shipping_cost' => $request->shipping_cost ?? 0,
                'notes' => $request->notes,
                'created_by' => Auth::id(),
            ]);

            foreach ($request->items as $item) {
                PurchaseOrderItem::create([
                    'purchase_order_id' => $purchaseOrder->id,
                    'product_id' => $item['product_id'],
                    'quantity_ordered' => $item['quantity_ordered'],
                    'unit_cost' => $item['unit_cost'],
                    'total_cost' => $item['quantity_ordered'] * $item['unit_cost'],
                ]);
            }

            $purchaseOrder->calculateTotals();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Purchase order created successfully',
                'purchase_order' => $this->formatPurchaseOrder($purchaseOrder),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error creating purchase order: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->load([
            'supplier',
            'items.product',
            'createdBy',
            'approvedBy',
            'receivedBy'
        ]);

        return response()->json([
            'purchase_order' => $this->formatPurchaseOrder($purchaseOrder) + [
                'items' => $purchaseOrder->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'product_id' => $item->product_id,
                        'quantity_ordered' => $item->quantity_ordered,
                        'quantity_received' => $item->quantity_received,
                        'unit_cost' => $item->unit_cost,
                        'total_cost' => $item->total_cost,
                        'product' => [
                            'product_name' => $item->product->product_name ?? 'Unknown'
                        ]
                    ];
                })
            ]
        ]);
    }

    public function update(Request $request, PurchaseOrder $purchaseOrder)
    {
        $request->validate([
            'expected_delivery_date' => 'required|date|after:today',
            'tax_amount' => 'nullable|numeric|min:0',
            'shipping_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $purchaseOrder->update([
                'expected_delivery_date' => $request->expected_delivery_date,
                'tax_amount' => $request->tax_amount ?? 0,
                'shipping_cost' => $request->shipping_cost ?? 0,
                'notes' => $request->notes,
            ]);

            $purchaseOrder->calculateTotals();

            return response()->json([
                'success' => true,
                'message' => 'Purchase order updated successfully',
                'purchase_order' => $this->formatPurchaseOrder($purchaseOrder),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating purchase order: ' . $e->getMessage()
            ], 500);
        }
    }

    public function sendToSupplier(PurchaseOrder $purchaseOrder)
    {
        try {
            if ($purchaseOrder->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending purchase orders can be sent to supplier'
                ], 400);
            }

            $purchaseOrder->update([
                'status' => 'sent',
                'approved_by' => Auth::id(),
                'approved_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Purchase order sent to supplier successfully',
                'purchase_order' => $this->formatPurchaseOrder($purchaseOrder),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error sending purchase order: ' . $e->getMessage()
            ], 500);
        }
    }

    public function receiveItems(Request $request, PurchaseOrder $purchaseOrder)
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.purchase_order_item_id' => 'required|exists:purchase_order_items,id',
            'items.*.quantity_received' => 'required|integer|min:0',
        ]);

        try {
            DB::beginTransaction();

            foreach ($request->items as $item) {
                $poItem = PurchaseOrderItem::find($item['purchase_order_item_id']);
                
                if ($poItem && $poItem->purchase_order_id === $purchaseOrder->id) {
                    $poItem->receiveQuantity($item['quantity_received'], Auth::id());
                }
            }

            $purchaseOrder->updateStatus();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Items received successfully',
                'purchase_order' => $this->formatPurchaseOrder($purchaseOrder),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error receiving items: ' . $e->getMessage()
            ], 500);
        }
    }

    public function cancel(PurchaseOrder $purchaseOrder)
    {
        try {
            if (!$purchaseOrder->canBeCancelled()) {
                return response()->json([
                    'success' => false,
                    'message' => 'This purchase order cannot be cancelled'
                ], 400);
            }

            $purchaseOrder->update(['status' => 'cancelled']);

            return response()->json([
                'success' => true,
                'message' => 'Purchase order cancelled successfully',
                'purchase_order' => $this->formatPurchaseOrder($purchaseOrder),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error cancelling purchase order: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getProducts()
    {
        // Filter for beverage categories only (exclude ice since it's made in-house)
        // Exclude purified ice tubes and other ice products - use multiple filtering methods
        $products = Product::with(['category', 'inventory'])
            ->where('is_active', true)
            ->where(function($query) {
                $query->where('product_name', 'NOT LIKE', '%ice%')
                      ->where('product_name', 'NOT LIKE', '%Ice%')
                      ->where('product_name', '!=', 'Purified Ice Tubes')
                      ->where('product_name', '!=', 'Ice Tubes')
                      ->where('product_name', '!=', 'Ice');
            })
            ->orderBy('product_name')
            ->get(['product_id', 'product_name', 'category_id', 'price', 'unit']);

        return response()->json([
            'products' => $products->map(function ($product) {
                return [
                    'product_id' => $product->product_id,
                    'product_name' => $product->product_name,
                    'category_name' => $product->category ? $product->category->category_name : 'Unknown',
                    'current_quantity' => $product->inventory ? $product->inventory->current_quantity : 0,
                    'min_stock_level' => $product->inventory ? $product->inventory->min_stock_level : 0,
                    'price' => $product->price,
                    'unit' => $product->unit,
                ];
            })
        ]);
    }

    public function getLowStockProducts()
    {
        // Filter for beverage categories only (exclude ice since it's made in-house)
        // Exclude purified ice tubes and other ice products - use multiple filtering methods
        $products = Product::with(['category', 'inventory'])
            ->where('is_active', true)
            ->where(function($query) {
                $query->where('product_name', 'NOT LIKE', '%ice%')
                      ->where('product_name', 'NOT LIKE', '%Ice%')
                      ->where('product_name', '!=', 'Purified Ice Tubes')
                      ->where('product_name', '!=', 'Ice Tubes')
                      ->where('product_name', '!=', 'Ice');
            })
            ->whereHas('inventory', function ($query) {
                $query->whereRaw('current_quantity <= min_stock_level + 0.0001');
            })
            ->orderBy('product_name')
            ->get();

        return response()->json([
            'products' => $products->map(function ($product) {
                return [
                    'product_id' => $product->product_id,
                    'product_name' => $product->product_name,
                    'category_name' => $product->category ? $product->category->category_name : 'Unknown',
                    'current_quantity' => $product->inventory ? $product->inventory->current_quantity : 0,
                    'min_stock_level' => $product->inventory ? $product->inventory->min_stock_level : 0,
                    'price' => $product->price,
                    'unit' => $product->unit,
                ];
            })
        ]);
    }
}
