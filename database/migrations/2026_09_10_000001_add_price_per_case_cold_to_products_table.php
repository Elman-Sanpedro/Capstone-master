<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Some beverages (e.g. beer) are sold by the case at two different
     * prices depending on whether the case is chilled ("cold") or not
     * ("regular"). `price_per_case` continues to represent the regular
     * price; this column holds the premium cold price and is left null
     * for products that don't offer a cold option (e.g. no cold option
     * is offered when buying by the bottle).
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'price_per_case_cold')) {
                $table->decimal('price_per_case_cold', 10, 2)->nullable()->after('price_per_case');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'price_per_case_cold')) {
                $table->dropColumn('price_per_case_cold');
            }
        });
    }
};
