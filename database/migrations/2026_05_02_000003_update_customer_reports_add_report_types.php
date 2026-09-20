<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customer_reports', function (Blueprint $table) {
            $table->enum('report_type', ['damaged_beverages', 'wrong_product', 'delivery_boy_issue', 'other'])->after('description');
            $table->string('delivery_boy_name')->nullable()->after('report_type');
            $table->text('delivery_boy_issue_details')->nullable()->after('delivery_boy_name');
        });
    }

    public function down(): void
    {
        Schema::table('customer_reports', function (Blueprint $table) {
            $table->dropColumn(['report_type', 'delivery_boy_name', 'delivery_boy_issue_details']);
        });
    }
};
