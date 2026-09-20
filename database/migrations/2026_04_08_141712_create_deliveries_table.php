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
        if (!Schema::hasTable('deliveries')) {
            Schema::create('deliveries', function (Blueprint $table) {
            $table->integer('delivery_id')->autoIncrement();
            $table->integer('order_id');
            $table->integer('rider_id')->nullable();
            $table->integer('assigned_by');
            $table->dateTime('assigned_date')->nullable()->useCurrent();
            $table->enum('delivery_status', ['Pending', 'In Transit', 'Delivered', 'Failed'])->nullable()->default('Pending');
            $table->dateTime('actual_delivery_date')->nullable();
            $table->decimal('collected_amount', 10, 2)->nullable()->default(0.00);
            $table->text('customer_notes')->nullable();
            $table->text('rider_notes')->nullable();
            
            $table->index('order_id');
            $table->index('rider_id');
            $table->index('assigned_by');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deliveries');
    }
};
