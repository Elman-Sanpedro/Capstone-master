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
        // Check if foreign key exists before dropping (portable across drivers)
        $foreignKeyExists = collect(Schema::getForeignKeys('orders'))
            ->contains(fn ($fk) => $fk['name'] === 'orders_customer_id_foreign');

        if ($foreignKeyExists) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropForeign('orders_customer_id_foreign');
            });
        }

        // Make customer_id nullable
        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedBigInteger('customer_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Make customer_id required again
            $table->unsignedBigInteger('customer_id')->nullable(false)->change();
            // Re-add the foreign key constraint
            $table->foreign('customer_id')->references('customer_id')->on('customers')->onDelete('cascade');
        });
    }
};
