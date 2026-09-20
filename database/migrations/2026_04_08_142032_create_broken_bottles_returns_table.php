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
        if (!Schema::hasTable('broken_bottles_returns')) {
            Schema::create('broken_bottles_returns', function (Blueprint $table) {
            $table->integer('return_id')->autoIncrement();
            $table->integer('order_id');
            $table->integer('customer_id');
            $table->integer('bottle_count');
            $table->decimal('deduction_amount', 10, 2);
            $table->date('returned_date');
            $table->integer('recorded_by');
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();
            
            $table->index('order_id');
            $table->index('customer_id');
            $table->index('recorded_by');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('broken_bottles_returns');
    }
};
