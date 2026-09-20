<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_fee_settings', function (Blueprint $table) {
            $table->id();
            $table->decimal('in_town_fee', 8, 2)->default(20.00);
            $table->decimal('out_of_town_fee', 8, 2)->default(30.00);
            $table->timestamps();
        });

        DB::table('delivery_fee_settings')->insert([
            'in_town_fee' => 20.00,
            'out_of_town_fee' => 30.00,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_fee_settings');
    }
};
