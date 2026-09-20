<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Raw SQL is MySQL-only syntax; other drivers (e.g. sqlite in tests, which start
        // with no legacy 'In Transit' rows to migrate) use the portable Schema Builder path.
        if (DB::connection()->getDriverName() === 'mysql') {
            // Expand the enum to include both values so the UPDATE doesn't truncate
            DB::statement("ALTER TABLE deliveries MODIFY delivery_status ENUM('Pending','In Transit','Out for Delivery','Delivered','Failed','Cancelled') DEFAULT 'Pending'");
            // Migrate existing rows
            DB::statement("UPDATE deliveries SET delivery_status = 'Out for Delivery' WHERE delivery_status = 'In Transit'");
            // Remove the old value
            DB::statement("ALTER TABLE deliveries MODIFY delivery_status ENUM('Pending','Out for Delivery','Delivered','Failed','Cancelled') DEFAULT 'Pending'");
        } else {
            Schema::table('deliveries', function (Blueprint $table) {
                $table->enum('delivery_status', ['Pending', 'Out for Delivery', 'Delivered', 'Failed', 'Cancelled'])->default('Pending')->change();
            });
        }
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("UPDATE deliveries SET delivery_status = 'In Transit' WHERE delivery_status = 'Out for Delivery'");
            DB::statement("ALTER TABLE deliveries MODIFY delivery_status ENUM('Pending','In Transit','Delivered','Failed','Cancelled') DEFAULT 'Pending'");
        } else {
            Schema::table('deliveries', function (Blueprint $table) {
                $table->enum('delivery_status', ['Pending', 'In Transit', 'Delivered', 'Failed', 'Cancelled'])->default('Pending')->change();
            });
        }
    }
};
