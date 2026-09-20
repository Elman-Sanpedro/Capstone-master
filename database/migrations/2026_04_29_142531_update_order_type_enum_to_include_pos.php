<?php

use Illuminate\Database\Migrations\Migration;
use App\Support\PostgresEnum;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            PostgresEnum::redefine('orders', 'order_type', ['preorder', 'delivery', 'pickup', 'pos'], nullable: false, default: 'delivery');

            return;
        }

        Schema::table('orders', function (Blueprint $table) {
            $table->enum('order_type', ['preorder', 'delivery', 'pickup', 'pos'])->default('delivery')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            PostgresEnum::redefine('orders', 'order_type', ['preorder', 'delivery', 'pickup'], nullable: false, default: 'delivery');

            return;
        }

        Schema::table('orders', function (Blueprint $table) {
            $table->enum('order_type', ['preorder', 'delivery', 'pickup'])->default('delivery')->change();
        });
    }
};
