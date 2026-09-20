<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('refund_status', ['none', 'requested', 'completed'])
                ->default('none')->after('cod_rejected_at');
            $table->decimal('refund_amount', 10, 2)->default(0)->after('refund_status');
            $table->timestamp('refund_requested_at')->nullable()->after('refund_amount');
            $table->timestamp('refund_completed_at')->nullable()->after('refund_requested_at');
            $table->foreignId('refund_completed_by')->nullable()
                ->after('refund_completed_at')->constrained('users')->nullOnDelete();
            $table->text('refund_note')->nullable()->after('refund_completed_by');
        });

        // One-time backfill: the admin Cancelled tab is switching from reading the
        // free-text `notes` column (the old "REFUND NEEDED"/"REFUNDED" string hack)
        // to reading these new structured columns. Without this, every order
        // already flagged under the old scheme would silently lose its refund
        // banner the moment this ships.
        //
        // Deliberately NOT just trusting the old notes flag verbatim: that flag
        // was set client-side, at cancel time, from a cruder check
        // (payment_status !== 'Unpaid'). It can go stale — e.g. a GCash proof
        // that was still "Awaiting Verification" at cancel time may have since
        // been rejected (payment_status back to 'Unpaid', screenshot kept "so
        // the customer knows it was reviewed and rejected"), in which case
        // nothing was ever actually confirmed received. So the backfill also
        // requires the same confirmed-payment condition Order::hasConfirmedPayment()
        // uses today (gcash_screenshot present AND payment_status Paid/Partial),
        // to avoid manufacturing a refund request for money that was never
        // actually confirmed in.
        $confirmedPayment = function ($query) {
            $query->whereNotNull('gcash_screenshot')
                ->where('gcash_screenshot', '!=', '')
                ->whereIn('payment_status', ['Paid', 'Partial']);
        };

        DB::table('orders')->where('notes', 'like', '%REFUND NEEDED%')
            ->where($confirmedPayment)
            ->update([
                'refund_status' => 'requested',
                'refund_amount' => DB::raw('down_payment'),
                'refund_requested_at' => DB::raw('updated_at'),
            ]);
        DB::table('orders')->where('notes', 'like', '%REFUNDED%')
            ->where('notes', 'not like', '%REFUND NEEDED%')
            ->where($confirmedPayment)
            ->update([
                'refund_status' => 'completed',
                'refund_amount' => DB::raw('down_payment'),
                'refund_requested_at' => DB::raw('updated_at'),
                'refund_completed_at' => DB::raw('updated_at'),
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['refund_completed_by']);
            $table->dropColumn([
                'refund_status',
                'refund_amount',
                'refund_requested_at',
                'refund_completed_at',
                'refund_completed_by',
                'refund_note',
            ]);
        });
    }
};
