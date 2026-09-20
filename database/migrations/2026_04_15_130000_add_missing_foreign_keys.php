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
        // Modify sales.recorded_by to unsignedBigInteger (if needed)
        try {
            Schema::table('sales', function (Blueprint $table) {
                $table->unsignedBigInteger('recorded_by')->change();
            });
        } catch (\Exception $e) {
            // Column might already be the correct type
        }

        // Add missing foreign keys
        // sales.recorded_by -> users.id
        try {
            Schema::table('sales', function (Blueprint $table) {
                $table->foreign('recorded_by', 'sales_recorded_by_foreign')
                      ->references('id')
                      ->on('users')
                      ->onDelete('cascade');
            });
        } catch (\Exception $e) {
            // Foreign key might already exist
        }

        // sales_items.sale_id -> sales.sale_id
        try {
            Schema::table('sales_items', function (Blueprint $table) {
                $table->foreign('sale_id', 'sales_items_sale_id_foreign')
                      ->references('sale_id')
                      ->on('sales')
                      ->onDelete('cascade');
            });
        } catch (\Exception $e) {
            // Foreign key might already exist
        }

        // sales_items.product_id -> products.product_id
        try {
            Schema::table('sales_items', function (Blueprint $table) {
                $table->foreign('product_id', 'sales_items_product_id_foreign')
                      ->references('product_id')
                      ->on('products')
                      ->onDelete('cascade');
            });
        } catch (\Exception $e) {
            // Foreign key might already exist
        }

        // stock_logs.product_id -> products.product_id
        try {
            Schema::table('stock_logs', function (Blueprint $table) {
                $table->foreign('product_id', 'stock_logs_product_id_foreign')
                      ->references('product_id')
                      ->on('products')
                      ->onDelete('cascade');
            });
        } catch (\Exception $e) {
            // Foreign key might already exist
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the foreign keys added by this migration
        Schema::table('stock_logs', function (Blueprint $table) {
            $table->dropForeign('stock_logs_product_id_foreign');
        });

        Schema::table('sales_items', function (Blueprint $table) {
            $table->dropForeign('sales_items_product_id_foreign');
            $table->dropForeign('sales_items_sale_id_foreign');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign('sales_recorded_by_foreign');
        });
    }
};
