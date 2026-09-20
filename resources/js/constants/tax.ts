export const TAX_CONSTANTS = {
  VAT_RATE: 0.12, // 12%

  /**
   * Calculate VAT amount from inclusive price (price already includes VAT)
   */
  calculateVAT: (inclusivePrice: number): number => {
    return Math.round((inclusivePrice - (inclusivePrice / (1 + TAX_CONSTANTS.VAT_RATE))) * 100) / 100;
  },

  /**
   * Calculate base price (exclusive of VAT) from inclusive price
   */
  calculateBasePrice: (inclusivePrice: number): number => {
    return Math.round((inclusivePrice / (1 + TAX_CONSTANTS.VAT_RATE)) * 100) / 100;
  },

  /**
   * Calculate VAT amount from base price (exclusive)
   */
  calculateVATFromBase: (basePrice: number): number => {
    return Math.round(basePrice * TAX_CONSTANTS.VAT_RATE * 100) / 100;
  },

  /**
   * Calculate inclusive price from base price
   */
  calculateInclusivePrice: (basePrice: number): number => {
    return Math.round(basePrice * (1 + TAX_CONSTANTS.VAT_RATE) * 100) / 100;
  },
};

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `₱${(num || 0).toFixed(2)}`;
};