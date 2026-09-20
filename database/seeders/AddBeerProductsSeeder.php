<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Category;

class AddBeerProductsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        echo "Adding beer products to the system...\n\n";

        // Get or create the Beverages category
        $beerCategory = Category::firstOrCreate(
            ['category_name' => 'Beverages'],
            [
                'category_name' => 'Beverages',
                'description' => 'Alcoholic beverages - San Miguel beer products'
            ]
        );

        echo "✓ Beer category ready (ID: {$beerCategory->category_id})\n\n";

        // Beer products data
        $beerProducts = [
            [
                'product_name' => 'Red Horse',
                'description' => 'Red Horse Beer - Extra strong lager beer',
                'unit' => 'case',
                'pieces_per_case' => 12,
                'price_per_case' => 770.00,
                'price_per_bottle' => 64.17, // 770 / 12
                'image' => 'images/redhorse.jpg',
            ],
            [
                'product_name' => 'San Mig Light',
                'description' => 'San Mig Light - Premium light beer',
                'unit' => 'case',
                'pieces_per_case' => 24,
                'price_per_case' => 1300.00,
                'price_per_bottle' => 54.17, // 1300 / 24
                'image' => 'images/sanmiglight.jpg',
            ],
            [
                'product_name' => 'San Mig Apple',
                'description' => 'San Mig Apple - Apple-flavored beer',
                'unit' => 'case',
                'pieces_per_case' => 24,
                'price_per_case' => 1100.00,
                'price_per_bottle' => 45.83, // 1100 / 24
                'image' => 'images/sanmigapple.jpg',
            ],
            [
                'product_name' => 'San Mig Pilsen',
                'description' => 'San Mig Pilsen - Classic Filipino beer',
                'unit' => 'case',
                'pieces_per_case' => 24,
                'price_per_case' => 1150.00,
                'price_per_bottle' => 47.92, // 1150 / 24
                'image' => 'images/pilsen.jpg',
            ],
        ];

        foreach ($beerProducts as $productData) {
            $product = Product::updateOrCreate(
                [
                    'product_name' => $productData['product_name'],
                    'category_id' => $beerCategory->category_id
                ],
                [
                    'category_id' => $beerCategory->category_id,
                    'product_name' => $productData['product_name'],
                    'description' => $productData['description'],
                    'unit' => $productData['unit'],
                    'price' => $productData['price_per_bottle'], // Default price per bottle
                    'price_per_case' => $productData['price_per_case'],
                    'price_per_bottle' => $productData['price_per_bottle'],
                    'is_active' => 1,
                ]
            );

            echo "✓ Product added/updated: {$product->product_name}\n";
            echo "  - Price per case: ₱" . number_format($productData['price_per_case'], 2) . "\n";
            echo "  - Price per bottle: ₱" . number_format($productData['price_per_bottle'], 2) . "\n\n";
        }

        echo "🎉 BEER PRODUCTS SUCCESSFULLY ADDED!\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        echo "Products added:\n";
        echo "1. Redhorse (12 pcs/case) - ₱770.00\n";
        echo "2. San Miguel Light (24 pcs/case) - ₱1,300.00\n";
        echo "3. San Miguel Apple (24 pcs/case) - ₱1,100.00\n";
        echo "4. Pilsen (24 pcs/case) - ₱1,150.00\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    }
}
