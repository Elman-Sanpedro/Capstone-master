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
        Schema::table('sales', function (Blueprint $table) {
            // A voided sale is kept as a record (never deleted) so it still
            // shows up in history/reports, just marked as reversed. Stock
            // deducted at sale time is added back separately via a
            // StockLog 'RETURN' entry, not tracked here.
            $table->timestamp('voided_at')->nullable()->after('payment_status');
            $table->unsignedBigInteger('voided_by')->nullable()->after('voided_at');
            $table->string('void_reason')->nullable()->after('voided_by');

            $table->foreign('voided_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign(['voided_by']);
            $table->dropColumn(['voided_at', 'voided_by', 'void_reason']);
        });
    }
};
