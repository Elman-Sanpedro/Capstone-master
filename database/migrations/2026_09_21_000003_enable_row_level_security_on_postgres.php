<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Supabase exposes every table in the "public" schema through its REST Data
 * API, which is open to anyone holding the project's (public) anon key unless
 * the table has row-level security. This app never uses that API, only
 * Laravel does, over a direct connection as the table-owning postgres role
 * (which bypasses RLS). Turning RLS on with no policies therefore closes the
 * API door without affecting the app.
 *
 * Tables added by later migrations need the same treatment; Supabase's
 * Security Advisor flags any that are missing it.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        $grammar = DB::connection()->getQueryGrammar();

        foreach (DB::select("select tablename from pg_tables where schemaname = 'public'") as $table) {
            DB::statement('alter table '.$grammar->wrap($table->tablename).' enable row level security');
        }
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        $grammar = DB::connection()->getQueryGrammar();

        foreach (DB::select("select tablename from pg_tables where schemaname = 'public'") as $table) {
            DB::statement('alter table '.$grammar->wrap($table->tablename).' disable row level security');
        }
    }
};
