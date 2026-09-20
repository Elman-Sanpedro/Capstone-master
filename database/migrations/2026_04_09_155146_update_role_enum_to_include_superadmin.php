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
            PostgresEnum::redefine('users', 'role', ['Customer', 'Admin', 'SuperAdmin'], nullable: false, default: 'Customer');

            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['Customer', 'Admin', 'SuperAdmin'])->default('Customer')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            PostgresEnum::redefine('users', 'role', ['Customer', 'Admin'], nullable: false, default: 'Customer');

            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['Customer', 'Admin'])->default('Customer')->change();
        });
    }
};
