<?php

use App\Support\PostgresEnum;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Raw SQL is MySQL-only syntax; other drivers (e.g. sqlite in tests) use the portable Schema Builder path.
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE `orders` MODIFY `order_type` ENUM('preorder', 'delivery', 'pickup', 'pos', 'walkin') DEFAULT 'delivery'");
        } elseif (DB::connection()->getDriverName() === 'pgsql') {
            PostgresEnum::redefine('orders', 'order_type', ['preorder', 'delivery', 'pickup', 'pos', 'walkin'], nullable: true, default: 'delivery');
        } else {
            Schema::table('orders', function (Blueprint $table) {
                $table->enum('order_type', ['preorder', 'delivery', 'pickup', 'pos', 'walkin'])->default('delivery')->change();
            });
        }
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE `orders` MODIFY `order_type` ENUM('preorder', 'delivery', 'pickup', 'pos') DEFAULT 'delivery'");
        } elseif (DB::connection()->getDriverName() === 'pgsql') {
            PostgresEnum::redefine('orders', 'order_type', ['preorder', 'delivery', 'pickup', 'pos'], nullable: true, default: 'delivery');
        } else {
            Schema::table('orders', function (Blueprint $table) {
                $table->enum('order_type', ['preorder', 'delivery', 'pickup', 'pos'])->default('delivery')->change();
            });
        }
    }
};
