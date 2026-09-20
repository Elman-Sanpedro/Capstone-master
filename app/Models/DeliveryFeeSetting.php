<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeliveryFeeSetting extends Model
{
    const IN_TOWN_MUNICIPALITY = 'Penaranda';

    protected $fillable = [
        'in_town_fee',
        'out_of_town_fee',
    ];

    protected function casts(): array
    {
        return [
            'in_town_fee' => 'decimal:2',
            'out_of_town_fee' => 'decimal:2',
        ];
    }

    public static function current(): self
    {
        return self::firstOrCreate([], [
            'in_town_fee' => 20.00,
            'out_of_town_fee' => 30.00,
        ]);
    }

    public static function feeFor(?string $municipality): float
    {
        $settings = self::current();

        if ($municipality && strcasecmp(trim($municipality), self::IN_TOWN_MUNICIPALITY) === 0) {
            return (float) $settings->in_town_fee;
        }

        return (float) $settings->out_of_town_fee;
    }
}
