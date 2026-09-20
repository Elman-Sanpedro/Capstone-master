<?php

use App\Support\PostgresEnum;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Alter payment_status enum to include 'Awaiting Verification'.
        // Raw SQL is MySQL-only syntax; other drivers (e.g. sqlite in tests) use the portable Schema Builder path.
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE orders MODIFY payment_status ENUM('Unpaid', 'Partial', 'Paid', 'Awaiting Verification') NULL DEFAULT 'Unpaid'");
        } elseif (DB::connection()->getDriverName() === 'pgsql') {
            PostgresEnum::redefine('orders', 'payment_status', ['Unpaid', 'Partial', 'Paid', 'Awaiting Verification'], nullable: true, default: 'Unpaid');
        } else {
            Schema::table('orders', function (Blueprint $table) {
                $table->enum('payment_status', ['Unpaid', 'Partial', 'Paid', 'Awaiting Verification'])->nullable()->default('Unpaid')->change();
            });
        }

        Schema::table('orders', function (Blueprint $table) {
            $table->string('gcash_screenshot')->nullable()->after('payment_status');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('gcash_screenshot');
        });

        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE orders MODIFY payment_status ENUM('Unpaid', 'Partial', 'Paid') NULL DEFAULT 'Unpaid'");
        } elseif (DB::connection()->getDriverName() === 'pgsql') {
            PostgresEnum::redefine('orders', 'payment_status', ['Unpaid', 'Partial', 'Paid'], nullable: true, default: 'Unpaid');
        } else {
            Schema::table('orders', function (Blueprint $table) {
                $table->enum('payment_status', ['Unpaid', 'Partial', 'Paid'])->nullable()->default('Unpaid')->change();
            });
        }
    }
};
