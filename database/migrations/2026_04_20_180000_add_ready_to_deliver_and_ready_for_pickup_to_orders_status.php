<?php

use Illuminate\Database\Migrations\Migration;
use App\Support\PostgresEnum;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            PostgresEnum::redefine('orders', 'status', ['Pending', 'Processing', 'Ready to Deliver', 'Ready for Pickup', 'Completed', 'Delivered', 'Cancelled'], nullable: false);

            return;
        }

        Schema::table('orders', function (Blueprint $table) {
            $table->enum('status', ['Pending', 'Processing', 'Ready to Deliver', 'Ready for Pickup', 'Completed', 'Delivered', 'Cancelled'])->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            PostgresEnum::redefine('orders', 'status', ['Pending', 'Processing', 'Completed', 'Delivered', 'Cancelled'], nullable: false);

            return;
        }

        Schema::table('orders', function (Blueprint $table) {
            $table->enum('status', ['Pending', 'Processing', 'Completed', 'Delivered', 'Cancelled'])->change();
        });
    }
};
