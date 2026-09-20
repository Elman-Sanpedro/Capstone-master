<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * MySQL compares strings case-insensitively (utf8mb4_unicode_ci), and the app
 * leans on that: login by email or username, password-reset and OTP lookups,
 * and unique:users,email / unique:users,username all treat "Elman@x.com" and
 * "elman@x.com" as the same account. PostgreSQL is case-sensitive, so on it a
 * phone keyboard capitalising the first letter would lock people out and two
 * accounts differing only by case could be registered.
 *
 * citext restores the MySQL behaviour for exactly these identity columns
 * (including their unique indexes) without touching any query.
 */
return new class extends Migration
{
    private const COLUMNS = [
        ['users', 'email'],
        ['users', 'username'],
        ['password_reset_tokens', 'email'],
        ['email_verification_tokens', 'email'],
    ];

    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('create extension if not exists citext with schema public');

        // The extension may already live elsewhere (Supabase enables extensions
        // into "extensions"), so qualify the type with wherever it really is.
        $schema = DB::selectOne(
            "select n.nspname as name from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname = 'citext' limit 1"
        )->name;

        $grammar = DB::connection()->getQueryGrammar();

        foreach (self::COLUMNS as [$table, $column]) {
            DB::statement(sprintf(
                'alter table %s alter column %s type %s.citext',
                $grammar->wrap($table),
                $grammar->wrap($column),
                $grammar->wrap($schema),
            ));
        }
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        $grammar = DB::connection()->getQueryGrammar();

        foreach (self::COLUMNS as [$table, $column]) {
            DB::statement(sprintf(
                'alter table %s alter column %s type varchar(255)',
                $grammar->wrap($table),
                $grammar->wrap($column),
            ));
        }
    }
};
