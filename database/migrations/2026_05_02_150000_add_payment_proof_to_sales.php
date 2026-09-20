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
            $table->string('payment_proof_type')->nullable()->after('payment_method'); // 'screenshot' or 'transaction_id'
            $table->string('payment_proof_path')->nullable()->after('payment_proof_type'); // path to uploaded screenshot
            $table->string('transaction_id')->nullable()->after('payment_proof_path'); // GCash transaction ID
            $table->enum('payment_status', ['pending', 'confirmed', 'rejected'])->default('confirmed')->after('transaction_id'); // for GCash payments
            $table->text('payment_notes')->nullable()->after('payment_status'); // admin notes for payment verification
            $table->integer('confirmed_by')->nullable()->after('payment_notes'); // admin who confirmed payment
            $table->integer('rejected_by')->nullable()->after('confirmed_by'); // admin who rejected payment
            $table->timestamp('confirmed_at')->nullable()->after('rejected_by'); // confirmation timestamp
            $table->timestamp('rejected_at')->nullable()->after('confirmed_at'); // rejection timestamp
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['payment_proof_type', 'payment_proof_path', 'transaction_id', 'payment_status', 'payment_notes', 'confirmed_by', 'rejected_by', 'confirmed_at', 'rejected_at']);
        });
    }
};
