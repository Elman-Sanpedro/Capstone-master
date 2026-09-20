<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

/**
 * Changing an enum()-style column on PostgreSQL.
 *
 * On PostgreSQL Laravel's enum() is a varchar with a CHECK constraint, and
 * Blueprint::change() emits invalid SQL for it ("... type varchar(255) check
 * (...)"). A plain type change also leaves the old CHECK in place, so it keeps
 * rejecting any newly allowed value. Migrations therefore rebuild the
 * constraint by hand through this helper (MySQL uses ALTER ... MODIFY instead).
 *
 * Constraint names follow PostgreSQL's auto-name for an inline column check:
 * {table}_{column}_check.
 */
final class PostgresEnum
{
    /**
     * Replace the allowed values of an enum-style column and set its
     * nullability / default, mirroring what MySQL's "MODIFY ... ENUM(...)"
     * does. A null $values drops the restriction (plain varchar); $length
     * also resizes the varchar.
     */
    public static function redefine(
        string $table,
        string $column,
        ?array $values,
        bool $nullable,
        ?string $default = null,
        ?int $length = null,
    ): void {
        $t = self::wrap($table);
        $c = self::wrap($column);

        self::dropCheck($table, $column);

        if ($length !== null) {
            DB::statement("alter table {$t} alter column {$c} type varchar({$length})");
        }

        DB::statement("alter table {$t} alter column {$c} ".($nullable ? 'drop not null' : 'set not null'));
        DB::statement("alter table {$t} alter column {$c} ".($default === null ? 'drop default' : 'set default '.self::quote($default)));

        if ($values !== null) {
            self::addCheck($table, $column, $values);
        }
    }

    public static function dropCheck(string $table, string $column): void
    {
        DB::statement(sprintf(
            'alter table %s drop constraint if exists %s',
            self::wrap($table),
            self::wrap("{$table}_{$column}_check"),
        ));
    }

    public static function addCheck(string $table, string $column, array $values): void
    {
        DB::statement(sprintf(
            'alter table %s add constraint %s check (%s in (%s))',
            self::wrap($table),
            self::wrap("{$table}_{$column}_check"),
            self::wrap($column),
            implode(', ', array_map([self::class, 'quote'], $values)),
        ));
    }

    private static function wrap(string $identifier): string
    {
        return DB::connection()->getQueryGrammar()->wrap($identifier);
    }

    private static function quote(string $value): string
    {
        return DB::connection()->getQueryGrammar()->quoteString($value);
    }
}
