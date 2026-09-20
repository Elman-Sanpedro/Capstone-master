<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;

class CheckAllProductNames extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        echo "=== CHECKING ALL PRODUCT NAMES ===\n\n";

        $products = Product::all(['product_id', 'product_name', 'unit', 'price', 'image']);

        foreach ($products as $product) {
            echo "ID: {$product->product_id} | Name: '{$product->product_name}' | Unit: {$product->unit} | Price: ₱{$product->price} | Image: {$product->image}\n";
        }

        echo "\n=== TOTAL PRODUCTS: {$products->count()} ===\n";
    }
}
