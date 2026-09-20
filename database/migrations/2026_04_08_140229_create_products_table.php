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
        if (!Schema::hasTable('products')) {
            Schema::create('products', function (Blueprint $table) {
            $table->integer('product_id')->autoIncrement();
            $table->integer('category_id');
            $table->string('product_name', 100);
            $table->text('description')->nullable();
            $table->string('unit', 20);
            $table->decimal('price', 10, 2);
            $table->decimal('price_per_case', 10, 2)->nullable();
            $table->decimal('price_per_bottle', 10, 2)->nullable();
            $table->boolean('is_active')->default(1);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->index('category_id');
            $table->foreign('category_id')->references('category_id')->on('categories')->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
