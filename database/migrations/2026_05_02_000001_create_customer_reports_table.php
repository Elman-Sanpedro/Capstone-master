<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_reports', function (Blueprint $table) {
            $table->id();
            $table->integer('order_id');
            $table->foreignId('customer_id')->constrained('users')->onDelete('cascade');
            $table->string('report_number')->unique();
            $table->text('description');
            $table->enum('status', ['submitted', 'under_review', 'validated', 'rejected', 'resolved'])->default('submitted');
            $table->enum('action_type', ['refund', 'replacement', 'none'])->nullable();
            $table->decimal('refund_amount', 10, 2)->nullable();
            $table->text('admin_notes')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });

        // Add foreign key constraint for order_id referencing orders.order_id
        Schema::table('customer_reports', function (Blueprint $table) {
            $table->foreign('order_id')->references('order_id')->on('orders')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_reports');
    }
};
