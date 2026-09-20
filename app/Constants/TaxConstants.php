<?php

namespace App\Constants;

class TaxConstants
{
    public const VAT_RATE = 0.12; // 12%

    /**
     * Calculate VAT amount from inclusive price (price already includes VAT)
     */
    public static function calculateVAT(float $inclusivePrice): float
    {
        return round($inclusivePrice - ($inclusivePrice / (1 + self::VAT_RATE)), 2);
    }

    /**
     * Calculate base price (exclusive of VAT) from inclusive price
     */
    public static function calculateBasePrice(float $inclusivePrice): float
    {
        return round($inclusivePrice / (1 + self::VAT_RATE), 2);
    }

    /**
     * Calculate VAT amount from base price (exclusive)
     */
    public static function calculateVATFromBase(float $basePrice): float
    {
        return round($basePrice * self::VAT_RATE, 2);
    }

    /**
     * Calculate inclusive price from base price
     */
    public static function calculateInclusivePrice(float $basePrice): float
    {
        return round($basePrice * (1 + self::VAT_RATE), 2);
    }
}