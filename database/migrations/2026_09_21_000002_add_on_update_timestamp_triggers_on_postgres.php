<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Several tables declare ->useCurrentOnUpdate() (MySQL's ON UPDATE
 * CURRENT_TIMESTAMP): customers/products/orders.updated_at and
 * inventory.last_updated. PostgreSQL has no such column option, and
 * Inventory has $timestamps = false, so stock decrements (which never touch
 * last_updated themselves) would leave it frozen. These triggers give
 * PostgreSQL the same behaviour: an UPDATE that changes the row but doesn't
 * set the column itself refreshes it; an explicit value always wins.
 */
return new class extends Migration
{
    /** table => column that MySQL refreshes automatically */
    private const TABLES = [
        'customers' => 'updated_at',
        'products' => 'updated_at',
        'orders' => 'updated_at',
        'inventory' => 'last_updated',
    ];

    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        foreach (array_unique(array_values(self::TABLES)) as $column) {
            DB::unprepared(<<<SQL
                create or replace function touch_{$column}() returns trigger language plpgsql as \$\$
                begin
                    if new.{$column} is not distinct from old.{$column} and new is distinct from old then
                        new.{$column} := current_timestamp;
                    end if;
                    return new;
                end
                \$\$
                SQL);
        }

        foreach (self::TABLES as $table => $column) {
            DB::unprepared("drop trigger if exists {$table}_touch_{$column} on {$table}");
            DB::unprepared("create trigger {$table}_touch_{$column} before update on {$table} for each row execute function touch_{$column}()");
        }
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        foreach (self::TABLES as $table => $column) {
            DB::unprepared("drop trigger if exists {$table}_touch_{$column} on {$table}");
        }

        foreach (array_unique(array_values(self::TABLES)) as $column) {
            DB::unprepared("drop function if exists touch_{$column}()");
        }
    }
};
