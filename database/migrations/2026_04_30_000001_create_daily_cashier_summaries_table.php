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
        Schema::create('daily_cashier_summaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cashier_id')->constrained('users');
            $table->date('summary_date');
            $table->decimal('total_sales', 10, 2)->default(0);
            $table->integer('total_transactions')->default(0);
            $table->decimal('total_cash_received', 10, 2)->default(0);
            $table->decimal('total_change', 10, 2)->default(0);
            $table->decimal('average_transaction', 10, 2)->default(0);
            $table->timestamp('reset_at')->nullable();
            $table->foreignId('reset_by')->nullable()->constrained('users');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['cashier_id', 'summary_date']);
            $table->index(['summary_date', 'cashier_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_cashier_summaries');
    }
};
