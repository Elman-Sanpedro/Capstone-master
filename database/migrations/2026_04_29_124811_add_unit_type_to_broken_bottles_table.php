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
        Schema::table('broken_bottles', function (Blueprint $table) {
            $table->enum('unit_type', ['bottle', 'case'])->default('bottle')->after('quantity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('broken_bottles', function (Blueprint $table) {
            $table->dropColumn('unit_type');
        });
    }
};
