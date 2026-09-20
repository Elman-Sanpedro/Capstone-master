<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;

class DeleteOldProducts extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        echo "Deleting old products with incorrect names...\n\n";

        // Delete products that don't match the IcePlantSeeder names
        $validNames = [
            'Purified Ice Tube',
            'Redhorse Beer',
            'San Mig Light',
            'San Mig Apple',
            'San Mig Pilsen',
        ];

        $deleted = Product::whereNotIn('product_name', $validNames)->delete();

        echo "✓ Deleted {$deleted} old product(s)\n\n";

        // Check remaining products
        $products = Product::all(['product_id', 'product_name', 'unit', 'price', 'image']);
        echo "=== REMAINING PRODUCTS ===\n";
        foreach ($products as $product) {
            echo "ID: {$product->product_id} | Name: '{$product->product_name}' | Unit: {$product->unit} | Price: ₱{$product->price} | Image: {$product->image}\n";
        }
        echo "\n🎉 Cleanup complete!\n";
    }
}
