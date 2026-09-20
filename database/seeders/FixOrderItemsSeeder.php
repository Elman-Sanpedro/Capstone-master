<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;

class FixOrderItemsSeeder extends Seeder
{
    public function run()
    {
        // Find the pending order #9
        $order = Order::find(9);
        
        if (!$order) {
            echo "Order #9 not found!\n";
            return;
        }

        echo "Found Order #9 with total: ₱{$order->total_amount}\n";

        // Check if it already has items
        $existingItems = OrderItem::where('order_id', 9)->count();
        if ($existingItems > 0) {
            echo "Order #9 already has {$existingItems} items\n";
            return;
        }

        // Get some products to add
        $products = Product::take(3)->get();
        
        if ($products->count() === 0) {
            echo "No products found to add to order!\n";
            return;
        }

        $totalAmount = 0;
        $itemsAdded = [];

        foreach ($products as $index => $product) {
            $quantity = $index === 0 ? 2 : 1; // First item quantity 2, others 1
            $unitPrice = $product->price;
            $subtotal = $quantity * $unitPrice;
            $totalAmount += $subtotal;

            // Create order item
            OrderItem::create([
                'order_id' => 9,
                'product_id' => $product->product_id,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'subtotal' => $subtotal,
            ]);

            $itemsAdded[] = "{$product->product_name} x {$quantity} = ₱{$subtotal}";
        }

        // Update order total to match items
        $order->total_amount = $totalAmount;
        $order->save();

        echo "Added " . count($itemsAdded) . " items to Order #9:\n";
        foreach ($itemsAdded as $item) {
            echo "  - {$item}\n";
        }
        echo "New total: ₱{$totalAmount}\n";
        echo "Order items should now display in admin panel!\n";
    }
}
