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
        Schema::create('broken_bottles', function (Blueprint $table) {
            $table->id();
            $table->enum('beverage_type', ['Red Horse', 'San Mig Light', 'San Mig Apple', 'San Mig Pilsen']);
            $table->integer('quantity')->default(1);
            $table->foreignId('reported_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('notes')->nullable();
            $table->date('report_date')->default(now());
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('broken_bottles');
    }
};
