<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedTinyInteger('gcash_resubmit_count')->default(0)->after('gcash_screenshot');
            $table->unsignedTinyInteger('gcash_rejected_count')->default(0)->after('gcash_resubmit_count');
            $table->timestamp('gcash_rejected_at')->nullable()->after('gcash_rejected_count');
            $table->boolean('gcash_flagged')->default(false)->after('gcash_rejected_at');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['gcash_resubmit_count', 'gcash_rejected_count', 'gcash_rejected_at', 'gcash_flagged']);
        });
    }
};
