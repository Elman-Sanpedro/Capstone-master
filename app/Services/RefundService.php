<?php

namespace App\Services;

use App\Models\Order;

class RefundService
{
    /**
     * Stamp the order with a refund request, but only when money is actually
     * owed back. Safe to call unconditionally from every cancel/reject path
     * (customer self-cancel, admin reject — both terminate the order as
     * 'Cancelled'). Mutates only, does not save() — callers already do one
     * save() for the status change that triggered this, so this never causes
     * a second write. Idempotent: a no-op if the order already has a request
     * or a completed refund.
     */
    public function requestForCancellation(Order $order): Order
    {
        if ($order->refund_status !== 'none') {
            return $order;
        }

        $amount = $order->calculateRefundAmount();

        if ($amount > 0) {
            $order->refund_status = 'requested';
            $order->refund_amount = $amount;
            $order->refund_requested_at = now();
        }

        return $order;
    }

    /**
     * Staff action once they've manually sent the money back (there's no
     * payment gateway here — GCash refunds are sent by hand outside this
     * system). Saves immediately since nothing else on the order changes at
     * the same time.
     */
    public function markCompleted(Order $order, int $completedByUserId, ?string $note = null): Order
    {
        $order->refund_status = 'completed';
        $order->refund_completed_at = now();
        $order->refund_completed_by = $completedByUserId;

        if (filled($note)) {
            $order->refund_note = $note;
        }

        $order->save();

        return $order;
    }
}
