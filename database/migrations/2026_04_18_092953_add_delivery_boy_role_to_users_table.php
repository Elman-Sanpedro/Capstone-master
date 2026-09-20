<?php

use App\Support\PostgresEnum;
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
        // Change role column from ENUM to VARCHAR to allow delivery_boy role.
        // Raw SQL is MySQL-only syntax; other drivers (e.g. sqlite in tests) use the portable Schema Builder path.
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role VARCHAR(50)");
        } elseif (DB::connection()->getDriverName() === 'pgsql') {
            // Also drops the enum's CHECK constraint, which a plain type change would leave behind.
            PostgresEnum::redefine('users', 'role', null, nullable: true, length: 50);
        } else {
            Schema::table('users', function (Blueprint $table) {
                $table->string('role', 50)->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to ENUM with original values
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('Admin', 'SuperAdmin', 'Customer')");
        } elseif (DB::connection()->getDriverName() === 'pgsql') {
            PostgresEnum::redefine('users', 'role', ['Admin', 'SuperAdmin', 'Customer'], nullable: true, length: 255);
        } else {
            Schema::table('users', function (Blueprint $table) {
                $table->enum('role', ['Admin', 'SuperAdmin', 'Customer'])->change();
            });
        }
    }
};
