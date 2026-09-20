<?php

use Illuminate\Database\Migrations\Migration;
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
        // Clear existing password reset tokens since they won't work with new OTP system
        DB::table('password_reset_tokens')->truncate();
        
        Schema::table('password_reset_tokens', function (Blueprint $table) {
            // Change token column to store 6-digit OTP (varchar instead of long text)
            $table->string('token', 6)->change();
            
            // Add expires_at column for OTP expiration (3-5 minutes)
            $table->timestamp('expires_at')->nullable()->after('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('password_reset_tokens', function (Blueprint $table) {
            // Revert token column back to original
            $table->text('token')->change();
            
            // Remove expires_at column
            $table->dropColumn('expires_at');
        });
    }
};
