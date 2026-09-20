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
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'price_per_case')) {
                $table->decimal('price_per_case', 10, 2)->nullable()->after('price');
            }
            if (!Schema::hasColumn('products', 'price_per_bottle')) {
                $table->decimal('price_per_bottle', 10, 2)->nullable()->after('price_per_case');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['price_per_case', 'price_per_bottle']);
        });
    }
};
