<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Inventory;
use App\Models\StockLog;
use App\Models\User;

class AddInitialStocksSeeder extends Seeder
{
    public function run(): void
    {
        echo "Adding initial stocks to inventory...\n\n";

        // Get admin user for stock logs
        $admin = User::where('username', 'admin')->first();
        if (!$admin) {
            $admin = User::where('role', 'SuperAdmin')->first();
        }
        $adminUserId = $admin ? $admin->id : 1;

        // Get all products
        $products = Product::all();

        foreach ($products as $product) {
            $initialStock = 0;
            $notes = '';

            // Ice Tubes (category_id 1)
            if ($product->category_id == 1) {
                $unit = strtolower($product->unit);
                
                // 1-10 kg: 20 stocks
                if (strpos($unit, '1kg') !== false || 
                    strpos($unit, '3kg') !== false || 
                    strpos($unit, '5kg') !== false || 
                    strpos($unit, '10kg') !== false) {
                    $initialStock = 20;
                    $notes = 'Initial stock for ice tube ' . $product->unit;
                }
                // 20 kg and above: 15 stocks
                elseif (strpos($unit, '20kg') !== false || 
                        strpos($unit, '30kg') !== false || 
                        strpos($unit, '40kg') !== false || 
                        strpos($unit, '50kg') !== false) {
                    $initialStock = 15;
                    $notes = 'Initial stock for ice tube ' . $product->unit;
                }
            }
            // Beverages (category_id 2 or 5): 10 cases each
            elseif ($product->category_id == 2 || $product->category_id == 5) {
                $initialStock = 10;
                $notes = 'Initial stock for beverage: ' . $product->product_name;
            }

            // Update inventory
            $inventory = Inventory::where('product_id', $product->product_id)->first();
            if ($inventory && $initialStock > 0) {
                $oldQuantity = $inventory->current_quantity;
                $inventory->current_quantity = $initialStock;
                $inventory->save();

                // Create stock log
                StockLog::create([
                    'product_id' => $product->product_id,
                    'user_id' => $adminUserId,
                    'transaction_type' => 'STOCK_IN',
                    'quantity' => $initialStock,
                    'unit_cost' => null,
                    'reference' => 'INITIAL_STOCK',
                    'transaction_date' => now(),
                    'notes' => $notes,
                ]);

                echo "✓ Stock added for {$product->product_name} ({$product->unit}): {$initialStock} units\n";
            } elseif ($initialStock == 0) {
                echo "⊘ No initial stock set for {$product->product_name} ({$product->unit})\n";
            }
        }

        echo "\n🎉 INITIAL STOCKS SUCCESSFULLY ADDED!\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    }
}
