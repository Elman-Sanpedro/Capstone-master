<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;

class UpdateProductImages extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        echo "Updating product images...\n\n";

        // Update beer product images
        $products = [
            'Redhorse' => 'images/redhorse.jpg',
            'San Miguel Light' => 'images/sanmiglight.jpg',
            'San Miguel Apple' => 'images/sanmigapple.jpg',
            'Pilsen' => 'images/pilsen.jpg',
        ];

        foreach ($products as $productName => $imagePath) {
            $product = Product::where('product_name', $productName)->first();

            if ($product) {
                $product->update(['image' => $imagePath]);
                echo "✓ Updated image for {$productName}: {$imagePath}\n";
            } else {
                echo "⚠️  Product not found: {$productName}\n";
            }
        }

        echo "\n🎉 Product images updated!\n";
    }
}
