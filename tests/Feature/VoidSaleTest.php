<?php

use App\Models\Category;
use App\Models\DailyCashierSummary;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Sale;
use App\Models\StockLog;
use App\Models\User;

/*
|--------------------------------------------------------------------------
| Regression tests for voiding a completed walk-in POS sale
|--------------------------------------------------------------------------
|
| A cashier voiding a sale should: restore the stock that sale deducted,
| record a StockLog of the reversal, mark the sale (and its order) voided
| without deleting either, and back that sale's numbers out of today's
| daily cashier summary. It should only ever apply to a sale the cashier
| themselves recorded, from today, and only once.
*/

function makeSale(array $overrides = []): Sale
{
    $cashier = $overrides['cashier'] ?? User::factory()->cashier()->create();

    $category = Category::create(['category_name' => 'Ice Tubes ' . uniqid()]);

    $product = Product::create([
        'category_id' => $category->category_id,
        'product_name' => 'Purified Ice Tube 1kg',
        'unit' => 'kg',
        'price' => 10.00,
        'is_active' => true,
    ]);

    $inventory = Inventory::create([
        'product_id' => $product->product_id,
        'current_quantity' => 45, // already deducted from an original 50
        'min_stock_level' => 10,
    ]);

    $order = Order::create([
        'customer_id' => null,
        'user_id' => $cashier->id,
        'order_date' => now(),
        'total_amount' => 50.00,
        'overall_total' => 50.00,
        'status' => 'Completed',
        'payment_method' => 'Cash',
        'payment_status' => 'Paid',
        'order_type' => 'pos',
        'notes' => 'Walk-in customer POS sale',
    ]);

    OrderItem::create([
        'order_id' => $order->order_id,
        'product_id' => $product->product_id,
        'quantity' => 5,
        'unit_price' => 10.00,
        'subtotal' => 50.00,
    ]);

    $sale = Sale::create(array_merge([
        'order_id' => $order->order_id,
        'sale_date' => now(),
        'total_amount' => 50.00,
        'payment_received' => 60.00,
        'change_amount' => 10.00,
        'recorded_by' => $cashier->id,
        'payment_status' => 'confirmed',
    ], $overrides['sale'] ?? []));

    return $sale->fresh(['order.orderItems.product.inventory']);
}

test('a cashier can void their own sale from today, restoring stock', function () {
    $cashier = User::factory()->cashier()->create();
    $sale = makeSale(['cashier' => $cashier]);
    $product = $sale->order->orderItems->first()->product;

    DailyCashierSummary::create([
        'cashier_id' => $cashier->id,
        'summary_date' => today(),
        'total_sales' => 50.00,
        'total_transactions' => 1,
        'total_cash_received' => 60.00,
        'total_non_cash_received' => 0,
        'total_change' => 10.00,
        'average_transaction' => 50.00,
    ]);

    $this->actingAs($cashier);

    $this->postJson("/cashier/sales-history/{$sale->sale_id}/void", [
        'reason' => 'Customer changed their mind',
    ])->assertOk()->assertJson(['success' => true]);

    $sale->refresh();
    expect($sale->voided_at)->not->toBeNull();
    expect($sale->voided_by)->toBe($cashier->id);
    expect($sale->void_reason)->toBe('Customer changed their mind');

    expect($sale->order->fresh()->status)->toBe('Cancelled');

    // The 5 units sold are back in stock (45 + 5 = 50).
    expect((float) $product->inventory->fresh()->current_quantity)->toBe(50.0);

    $this->assertDatabaseHas('stock_logs', [
        'product_id' => $product->product_id,
        'transaction_type' => 'RETURN',
        'quantity' => 5,
    ]);

    $summary = DailyCashierSummary::getTodaySummary($cashier->id);
    expect((float) $summary->total_sales)->toBe(0.0);
    expect($summary->total_transactions)->toBe(0);
    expect((float) $summary->total_cash_received)->toBe(0.0);
    expect((float) $summary->total_change)->toBe(0.0);
});

test('a sale cannot be voided twice', function () {
    $cashier = User::factory()->cashier()->create();
    $sale = makeSale(['cashier' => $cashier]);

    $this->actingAs($cashier);

    $this->postJson("/cashier/sales-history/{$sale->sale_id}/void", ['reason' => 'First void'])
        ->assertOk();

    $this->postJson("/cashier/sales-history/{$sale->sale_id}/void", ['reason' => 'Second attempt'])
        ->assertStatus(422);
});

test('a cashier cannot void another cashiers sale', function () {
    $owner = User::factory()->cashier()->create();
    $intruder = User::factory()->cashier()->create();
    $sale = makeSale(['cashier' => $owner]);

    $this->actingAs($intruder);

    $this->postJson("/cashier/sales-history/{$sale->sale_id}/void", ['reason' => 'Not mine'])
        ->assertStatus(404);
});

test('voiding requires a reason', function () {
    $cashier = User::factory()->cashier()->create();
    $sale = makeSale(['cashier' => $cashier]);

    $this->actingAs($cashier);

    $this->postJson("/cashier/sales-history/{$sale->sale_id}/void", [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['reason']);
});

test('a sale from a previous day cannot be voided', function () {
    $cashier = User::factory()->cashier()->create();
    $sale = makeSale(['cashier' => $cashier]);
    $sale->forceFill(['created_at' => now()->subDay()])->save();

    $this->actingAs($cashier);

    $this->postJson("/cashier/sales-history/{$sale->sale_id}/void", ['reason' => 'Too late'])
        ->assertStatus(422);

    expect($sale->fresh()->voided_at)->toBeNull();
});
