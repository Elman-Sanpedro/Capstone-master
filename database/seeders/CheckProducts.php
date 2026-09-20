<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;

class CheckProducts extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        echo "=== CHECKING PRODUCTS IN DATABASE ===\n\n";

        $products = Product::all(['product_id', 'product_name', 'unit', 'price', 'price_per_case', 'price_per_bottle', 'image']);

        foreach ($products as $product) {
            echo "ID: {$product->product_id}\n";
            echo "Name: {$product->product_name}\n";
            echo "Unit: {$product->unit}\n";
            echo "Price: ₱{$product->price}\n";
            echo "Price per Case: ₱{$product->price_per_case}\n";
            echo "Price per Bottle: ₱{$product->price_per_bottle}\n";
            echo "Image: {$product->image}\n";
            echo "─────────────────────────────\n";
        }

        echo "\n=== TOTAL PRODUCTS: {$products->count()} ===\n";
    }
}
