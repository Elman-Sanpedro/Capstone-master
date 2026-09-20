export const PENDING_PAYMENTS_UPDATED_EVENT = 'cashier:pending-payments-updated';

/**
 * Broadcasts that a GCash/COD payment proof was confirmed or rejected, so
 * every mounted piece of UI that keeps its own copy of the pending-payments
 * count (the header's notification bell, the dashboard's Action Needed
 * cards, the Orders page) can refetch instead of showing a stale number
 * until the next full page load.
 */
export function notifyPendingPaymentsUpdated() {
    window.dispatchEvent(new Event(PENDING_PAYMENTS_UPDATED_EVENT));
}
