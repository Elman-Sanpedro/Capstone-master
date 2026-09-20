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
        // Step 1: Fix column types to match foreign key references
        Schema::table('stock_logs', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->change();
        });

        Schema::table('deliveries', function (Blueprint $table) {
            $table->unsignedBigInteger('rider_id')->nullable()->change();
        });

        Schema::table('deliveries', function (Blueprint $table) {
            $table->unsignedBigInteger('assigned_by')->change();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->change();
        });

        Schema::table('broken_bottles_returns', function (Blueprint $table) {
            $table->unsignedBigInteger('recorded_by')->change();
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->change();
        });

        // Step 2: Clean up any orphaned records
        $this->cleanOrphanedRecords();

        // Step 3: Add missing foreign keys
        // Stock Logs -> Users (missing)
        Schema::table('stock_logs', function (Blueprint $table) {
            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
        });

        // Broken Bottles Returns -> Orders
        Schema::table('broken_bottles_returns', function (Blueprint $table) {
            $table->foreign('order_id')
                  ->references('order_id')
                  ->on('orders')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
        });

        // Broken Bottles Returns -> Customers
        Schema::table('broken_bottles_returns', function (Blueprint $table) {
            $table->foreign('customer_id')
                  ->references('customer_id')
                  ->on('customers')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
        });

        // Broken Bottles Returns -> Users
        Schema::table('broken_bottles_returns', function (Blueprint $table) {
            $table->foreign('recorded_by')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
        });

        // Audit Logs -> Users
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
        });
    }

    /**
     * Clean up any orphaned records before adding foreign keys
     */
    private function cleanOrphanedRecords(): void
    {
        // Clean stock_logs with invalid user_id
        DB::table('stock_logs')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                      ->from('users')
                      ->whereRaw('users.id = stock_logs.user_id');
            })
            ->delete();

        // Clean broken_bottles_returns with invalid order_id
        DB::table('broken_bottles_returns')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                      ->from('orders')
                      ->whereRaw('orders.order_id = broken_bottles_returns.order_id');
            })
            ->delete();

        // Clean broken_bottles_returns with invalid customer_id
        DB::table('broken_bottles_returns')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                      ->from('customers')
                      ->whereRaw('customers.customer_id = broken_bottles_returns.customer_id');
            })
            ->delete();

        // Clean broken_bottles_returns with invalid recorded_by
        DB::table('broken_bottles_returns')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                      ->from('users')
                      ->whereRaw('users.id = broken_bottles_returns.recorded_by');
            })
            ->delete();

        // Clean audit_logs with invalid user_id
        DB::table('audit_logs')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                      ->from('users')
                      ->whereRaw('users.id = audit_logs.user_id');
            })
            ->delete();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the newly added foreign keys
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('broken_bottles_returns', function (Blueprint $table) {
            $table->dropForeign(['recorded_by']);
            $table->dropForeign(['customer_id']);
            $table->dropForeign(['order_id']);
        });

        Schema::table('stock_logs', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        // Revert back to integer types
        Schema::table('stock_logs', function (Blueprint $table) {
            $table->integer('user_id')->change();
        });

        Schema::table('deliveries', function (Blueprint $table) {
            $table->integer('rider_id')->nullable()->change();
        });

        Schema::table('deliveries', function (Blueprint $table) {
            $table->integer('assigned_by')->change();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->integer('user_id')->change();
        });

        Schema::table('broken_bottles_returns', function (Blueprint $table) {
            $table->integer('recorded_by')->change();
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->integer('user_id')->change();
        });
    }
};
