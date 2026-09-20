<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

/**
 * Splits the existing beer case price into a "regular" (price_per_case,
 * the default/no-toggle price) and a "cold" (price_per_case_cold, only
 * offered when buying by the case) price. Run once via:
 *   php artisan db:seed --class=Database\\Seeders\\AddColdBeveragePricingSeeder
 *
 * The current price_per_case values in the database were, in practice,
 * always the "cold" price the store actually charges, so they move to
 * price_per_case_cold and price_per_case drops to the lower regular price.
 * price_per_bottle is untouched: no cold option is offered by the bottle.
 */
class AddColdBeveragePricingSeeder extends Seeder
{
    public function run(): void
    {
        // [product_name => [regular case price, cold case price]]
        $pricing = [
            'Redhorse Beer'  => [750.00, 770.00],
            'San Mig Light'  => [1250.00, 1300.00],
            'San Mig Pilsen' => [1100.00, 1150.00],
            'San Mig Apple'  => [1050.00, 1100.00],
        ];

        foreach ($pricing as $productName => [$regular, $cold]) {
            $products = Product::where('product_name', $productName)->get();

            if ($products->isEmpty()) {
                echo "! No product found named '{$productName}', skipped.\n";
                continue;
            }

            foreach ($products as $product) {
                $product->price = $regular;
                $product->price_per_case = $regular;
                $product->price_per_case_cold = $cold;
                $product->save();

                echo "✓ {$productName} (ID {$product->product_id}): regular case ₱{$regular}, cold case ₱{$cold}\n";
            }
        }
    }
}
