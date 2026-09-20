<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;

class FixProductImages extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        echo "Fixing product images to match IcePlantSeeder names...\n\n";

        // Update product images with correct names from IcePlantSeeder
        $products = [
            'Purified Ice Tube' => 'images/icetube.jpg',
            'Redhorse Beer' => 'images/redhorse.jpg',
            'San Mig Light' => 'images/sanmiglight.jpg',
            'San Mig Apple' => 'images/sanmigapple.jpg',
            'San Mig Pilsen' => 'images/pilsen.jpg',
        ];

        foreach ($products as $productName => $imagePath) {
            $updated = Product::where('product_name', $productName)->update(['image' => $imagePath]);
            if ($updated > 0) {
                echo "✓ Updated image for {$productName}: {$imagePath} ({$updated} record(s))\n";
            } else {
                echo "⚠️  No records found for: {$productName}\n";
            }
        }

        echo "\n🎉 Product images fixed!\n";
    }
}
