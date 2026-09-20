<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Mirrors gcash_rejected_at so a rejected COD down-payment proof can be
            // distinguished from an order that simply hasn't been paid yet.
            $table->timestamp('cod_rejected_at')->nullable()->after('gcash_flagged');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['cod_rejected_at']);
        });
    }
};
