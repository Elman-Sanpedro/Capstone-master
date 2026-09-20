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
        if (!Schema::hasTable('sales')) {
            Schema::create('sales', function (Blueprint $table) {
            $table->integer('sale_id')->autoIncrement();
            $table->integer('order_id');
            $table->date('sale_date');
            $table->decimal('total_amount', 10, 2);
            $table->decimal('payment_received', 10, 2);
            $table->decimal('change_amount', 10, 2)->nullable()->default(0.00);
            $table->integer('recorded_by');
            $table->timestamp('created_at')->useCurrent();
            
            $table->index('order_id');
            $table->index('recorded_by');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
