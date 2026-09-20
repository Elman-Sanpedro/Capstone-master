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
        if (!Schema::hasTable('orders')) {
            Schema::create('orders', function (Blueprint $table) {
            $table->integer('order_id')->autoIncrement();
            $table->integer('customer_id');
            $table->integer('user_id');
            $table->dateTime('order_date')->useCurrent();
            $table->decimal('total_amount', 10, 2)->default(0.00);
            $table->decimal('delivery_fee', 10, 2)->nullable()->default(0.00);
            $table->decimal('overall_total', 10, 2)->default(0.00);
            $table->enum('status', ['Pending', 'Processing', 'Completed', 'Delivered', 'Cancelled'])->nullable()->default('Pending');
            $table->enum('payment_method', ['Cash', 'Credit', 'GCash'])->nullable()->default('Cash');
            $table->enum('payment_status', ['Unpaid', 'Partial', 'Paid'])->nullable()->default('Unpaid');
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            
            $table->index('customer_id');
            $table->index('user_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
