// Display-only mirror of Order::hasConfirmedPayment() / calculateRefundAmount()
// (app/Models/Order.php) — lets the cancel confirmation show a real refund
// amount before the request round-trips to the server. The server
// independently recomputes and persists the authoritative amount in
// RefundService::requestForCancellation(); this is never trusted for anything
// but what to show in the confirmation prompt.
//
// down_payment/total_amount are typed `number` on Order but — like
// inventory.current_quantity (see QuantityInput.tsx's toStockCount) — decimal
// columns can arrive as numeric strings, so everything here is coerced with
// Number(...) rather than assumed to already be a number.
export interface RefundableOrder {
    down_payment?: number | string | null;
    total_amount?: number | string | null;
    payment_status?: string | null;
    gcash_screenshot?: string | null;
}

export function hasConfirmedPayment(order: RefundableOrder): boolean {
    return !!order.gcash_screenshot && (order.payment_status === 'Paid' || order.payment_status === 'Partial');
}

export function calculateRefundPreview(order: RefundableOrder): number {
    return hasConfirmedPayment(order) ? Number(order.down_payment ?? 0) : 0;
}

export function isFullPaymentRefund(order: RefundableOrder): boolean {
    const downPayment = Number(order.down_payment ?? 0);
    return downPayment > 0 && downPayment >= Number(order.total_amount ?? 0);
}
