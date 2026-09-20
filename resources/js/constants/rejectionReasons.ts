// Shared between every place that rejects a GCash/COD payment PROOF (a
// customer's uploaded screenshot) — cashier/orders.tsx's two dedicated reject
// modals, and the notification-bell quick action in components/app-header.tsx
// (used by both the cashier and admin layouts). One list here means the
// wording an admin sees and the wording a cashier sees can't drift apart, and
// a new reason only needs adding in one place.
//
// This is deliberately a separate list from admin/pre-orders.tsx's
// REJECTION_REASONS: that one rejects a whole ORDER (stock, address, fraud,
// scheduling); this one rejects a specific uploaded PROOF IMAGE — different
// real-world reasons apply, so they shouldn't share a list.
export const PAYMENT_PROOF_REJECTION_REASONS = [
    'Screenshot is blurry or unreadable',
    "Amount shown doesn't match the required payment",
    'Reference number not found or invalid',
    'Screenshot appears edited or fake',
    'Duplicate or reused screenshot',
    'Sent to the wrong GCash account',
];

// Sentinel <select> value that means "let them type their own reason" — kept
// as an actual string (not e.g. an empty string) so it can never collide with
// a genuinely blank/unselected state.
export const OTHER_REJECTION_REASON = '__other__';
