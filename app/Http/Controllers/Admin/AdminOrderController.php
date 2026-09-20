<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Order;
use App\Models\User;
use App\Models\Inventory;
use App\Models\StockLog;
use App\Services\RefundService;
use Inertia\Inertia;
use Illuminate\Http\RedirectResponse;

class AdminOrderController extends Controller
{
    public function index(): \Inertia\Response
    {
        return Inertia::render('admin/pre-orders');
    }

    public function getPendingOrders()
    {
        $orders = Order::with(['customer', 'user', 'orderItems.product.inventory'])
            ->where('approval_status', 'pending')
            ->orderBy('order_date', 'desc')
            ->get();

        return response()->json($orders);
    }

    public function getProcessingOrders()
    {
        // Sorted by updated_at, not order_date — an order placed days ago that just
        // moved into Processing should surface above one that's been sitting here longer.
        $orders = Order::with(['customer', 'user', 'orderItems.product.inventory', 'delivery.rider'])
            ->whereIn('status', ['Processing', 'Ready to Deliver'])
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json($orders);
    }

    public function getDeliveredOrders()
    {
        $orders = Order::with(['customer', 'user', 'orderItems.product.inventory', 'delivery.rider'])
            ->where('status', 'Delivered')
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json($orders);
    }

    public function getCompletedOrders()
    {
        $orders = Order::with(['customer', 'user', 'orderItems.product.inventory', 'delivery.rider'])
            ->where('status', 'Completed')
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json($orders);
    }

    public function getCancelledOrders()
    {
        $orders = Order::with(['customer', 'user', 'orderItems.product.inventory', 'delivery.rider'])
            ->where('status', 'Cancelled')
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json($orders);
    }

    public function completeRefund(Request $request, $id)
    {
        $request->validate([
            'note' => 'nullable|string|max:1000',
        ]);

        $order = Order::find($id);

        if (!$order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        if ($order->refund_status !== 'requested') {
            return response()->json(['error' => 'This order has no pending refund request.'], 400);
        }

        (new RefundService())->markCompleted($order, Auth::id(), $request->input('note'));

        return response()->json([
            'message' => 'Refund marked as completed',
            'order' => $order,
        ]);
    }

    public function getDeliveryBoys()
    {
        $deliveryBoys = User::where('role', 'delivery_boy')
            ->where('is_active', true)
            ->get(['id', 'full_name', 'email', 'contact_number']);

        return response()->json($deliveryBoys);
    }

    public function acceptOrder(Request $request, $id)
    {
        $order = Order::find($id);

        if (!$order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        if ($order->approval_status !== 'pending') {
            return response()->json(['error' => 'Order can only be accepted when approval status is pending'], 400);
        }

        // Check stock availability before approving
        foreach ($order->orderItems as $item) {
            $product = $item->product;
            if (!$product->inventory || $product->inventory->current_quantity < $item->quantity) {
                $availableStock = $product->inventory ? $product->inventory->current_quantity : 0;
                return response()->json([
                    'error' => "Insufficient stock for {$product->product_name}. Required: {$item->quantity}, Available: {$availableStock}"
                ], 400);
            }
        }

        // Update approval status and order status
        $wasPending = $order->status === 'Pending';
        $order->approval_status = 'approved';
        $order->status = 'Processing';
        $order->save();

        // Deduct stock from inventory (only if not already deducted)
        if ($wasPending) {
            foreach ($order->orderItems as $item) {
                $product = $item->product;
                if ($product->inventory) {
                    $product->inventory->decrement('current_quantity', $item->quantity);
                }
            }
        }

        return response()->json([
            'message' => 'Order approved successfully',
            'order' => $order->load('orderItems.product.inventory')
        ]);
    }

    public function approveOrder($id)
    {
        $order = Order::with('delivery')->find($id);

        if (!$order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        if ($order->approval_status !== 'pending') {
            return response()->json(['error' => 'Order can only be approved when approval status is pending'], 400);
        }

        // Update approval status
        $wasPending = $order->status === 'Pending';
        $order->approval_status = 'approved';
        $order->status = 'Processing';
        $order->save();

        // Deduct stock from inventory (only if not already deducted)
        if ($wasPending) {
            foreach ($order->orderItems as $item) {
                $product = $item->product;
                if ($product->inventory) {
                    $product->inventory->decrement('current_quantity', $item->quantity);
                }
            }
        }

        return response()->json([
            'message' => 'Order approved successfully',
            'order' => $order->load('orderItems.product')
        ]);
    }

    public function assignDelivery(Request $request, $id)
    {
        $request->validate([
            'rider_id' => 'required|exists:users,id',
        ]);

        $order = Order::with('delivery')->find($id);

        if (!$order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        if ($order->status !== 'Processing') {
            return response()->json([
                'error' => 'Order must be in Processing status to assign delivery',
                'current_status' => $order->status
            ], 400);
        }

        if ($order->approval_status !== 'approved') {
            return response()->json(['error' => 'Order must be approved before assigning delivery'], 400);
        }

        // Check if delivery already exists
        if ($order->delivery && $order->delivery->delivery_status !== 'Failed') {
            return response()->json(['error' => 'Delivery already assigned for this order'], 400);
        }

        try {
            // Create or update delivery record
            $delivery = \App\Models\Delivery::updateOrCreate(
                ['order_id' => $order->order_id],
                [
                    'rider_id' => $request->rider_id,
                    'assigned_by' => Auth::id(),
                    'assigned_date' => now(),
                    'delivery_status' => 'Pending',
                ]
            );

            // Order status stays as Processing
            // Don't change it to Ready to Deliver

            return response()->json([
                'message' => 'Delivery assigned successfully',
                'delivery' => $delivery->load('rider', 'order'),
                'debug' => [
                    'rider_id' => $delivery->rider_id,
                    'assigned_by' => $delivery->assigned_by,
                    'delivery_status' => $delivery->delivery_status,
                    'order_id' => $delivery->order_id,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to assign delivery: ' . $e->getMessage()
            ], 500);
        }
    }

    public function rejectOrder(Request $request, $id)
    {
        $request->validate([
            'rejection_reason' => 'required|string',
        ]);

        $order = Order::with('orderItems')->find($id);

        if (!$order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        if ($order->approval_status !== 'pending') {
            return response()->json(['error' => 'Order can only be rejected when approval status is pending'], 400);
        }

        // Stock was deducted at checkout, not at delivery — give it back now that
        // the order never went out, otherwise it stays permanently missing from inventory.
        foreach ($order->orderItems as $item) {
            $inventory = Inventory::where('product_id', $item->product_id)->first();
            if ($inventory) {
                $inventory->increment('current_quantity', $item->quantity);

                StockLog::create([
                    'product_id' => $item->product_id,
                    'user_id' => Auth::id(),
                    'transaction_type' => 'RETURN',
                    'quantity' => $item->quantity,
                    'reference' => 'Order #' . $order->order_id,
                    'transaction_date' => now(),
                    'notes' => 'Order rejected by admin',
                ]);
            }
        }

        // Update approval status and order status
        $order->approval_status = 'rejected';
        $order->status = 'Cancelled';
        $order->notes = $request->rejection_reason;

        // Stamps a refund request if (and only if) money was actually
        // confirmed received for this order — reuses the same save() below.
        (new RefundService())->requestForCancellation($order);

        $order->save();

        return response()->json([
            'message' => 'Order rejected successfully',
            'order' => $order
        ]);
    }

    public function confirmSuccessfulDelivery($id)
    {
        $order = Order::find($id);

        if (!$order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        if ($order->status === 'Completed') {
            return response()->json([
                'error' => 'Order is already completed',
                'current_status' => $order->status
            ], 400);
        }

        if ($order->status !== 'Delivered') {
            return response()->json([
                'error' => 'Order must be delivered before confirming success',
                'current_status' => $order->status
            ], 400);
        }

        // Update order status to Completed
        $order->status = 'Completed';
        $order->payment_status = 'Paid';
        $order->save();

        return response()->json([
            'message' => 'Order confirmed as successfully delivered',
            'order' => $order->load('orderItems.product', 'delivery.rider')
        ]);
    }

    public function confirmPayment(Request $request, $id)
    {
        $order = Order::find($id);

        if (!$order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        $request->validate([
            'payment_status' => 'required|in:Paid,Partial,Unpaid',
        ]);

        // Update payment status
        $order->payment_status = $request->payment_status;

        // If payment is confirmed as Paid and order is Delivered, auto-complete
        if ($request->payment_status === 'Paid' && $order->status === 'Delivered') {
            $order->status = 'Completed';
        }

        $order->save();

        return response()->json([
            'message' => 'Payment status updated successfully',
            'order' => $order->load('orderItems.product', 'delivery.rider')
        ]);
    }
}
