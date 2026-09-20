<?php

use App\Support\PostgresEnum;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * InventoryService::createPurchaseOrderForLowStock() logs a
     * 'PURCHASE_ORDER_CREATED' stock_logs entry, but that value was never
     * part of the enum — every insert throws (SQLSTATE[01000]: Data
     * truncated for column 'transaction_type'), which rolls back the whole
     * transaction and silently kills the auto purchase-order-on-low-stock
     * feature. Add the missing value.
     */
    public function up(): void
    {
        // Raw SQL is MySQL-only syntax; other drivers (e.g. sqlite in tests) use the portable Schema Builder path.
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE `stock_logs` MODIFY `transaction_type` ENUM('STOCK_IN', 'STOCK_OUT', 'RETURN', 'PURCHASE_ORDER_CREATED') NOT NULL");
        } elseif (DB::connection()->getDriverName() === 'pgsql') {
            PostgresEnum::redefine('stock_logs', 'transaction_type', ['STOCK_IN', 'STOCK_OUT', 'RETURN', 'PURCHASE_ORDER_CREATED'], nullable: false);
        } else {
            Schema::table('stock_logs', function (Blueprint $table) {
                $table->enum('transaction_type', ['STOCK_IN', 'STOCK_OUT', 'RETURN', 'PURCHASE_ORDER_CREATED'])->change();
            });
        }
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE `stock_logs` MODIFY `transaction_type` ENUM('STOCK_IN', 'STOCK_OUT', 'RETURN') NOT NULL");
        } elseif (DB::connection()->getDriverName() === 'pgsql') {
            PostgresEnum::redefine('stock_logs', 'transaction_type', ['STOCK_IN', 'STOCK_OUT', 'RETURN'], nullable: false);
        } else {
            Schema::table('stock_logs', function (Blueprint $table) {
                $table->enum('transaction_type', ['STOCK_IN', 'STOCK_OUT', 'RETURN'])->change();
            });
        }
    }
};
