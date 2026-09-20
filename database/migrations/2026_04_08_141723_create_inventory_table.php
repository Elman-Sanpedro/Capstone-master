<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('inventory')) {
            Schema::create('inventory', function (Blueprint $table) {
            $table->integer('inventory_id')->autoIncrement();
            $table->integer('product_id')->unique();
            $table->decimal('current_quantity', 10, 2)->default(0.00);
            $table->decimal('min_stock_level', 10, 2)->nullable()->default(10.00);
            $table->timestamp('last_updated')->useCurrent()->useCurrentOnUpdate();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory');
    }
};
