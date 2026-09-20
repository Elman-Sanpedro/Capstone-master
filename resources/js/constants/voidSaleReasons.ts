// Shared between every place a cashier voids a completed POS sale — the
// quick-void button on the receipt screen (cashier/pos.tsx) and the void
// action in Sales History (cashier/sales-history.tsx). One list keeps the
// wording consistent and gives the void reason field on a Sale a fixed,
// scannable set of values instead of free-typed text every time.
export const VOID_SALE_REASONS = [
    'Customer changed their mind',
    'Wrong item rung up',
    'Wrong quantity entered',
    'Price entry error',
    'Duplicate transaction',
    'Customer could not pay',
    'Item out of stock / unavailable',
];

// Sentinel <select> value that means "let them type their own reason" — kept
// as an actual string (not e.g. an empty string) so it can never collide with
// a genuinely blank/unselected state.
export const OTHER_VOID_REASON = '__other__';
