<?php

namespace App\Console\Commands;

use App\Models\Order;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class CancelExpiredGcashOrders extends Command
{
    protected $signature = 'gcash:cancel-expired';
    protected $description = 'Cancel GCash orders where the customer did not resubmit proof within 24 hours of rejection.';

    public function handle(): int
    {
        $cutoff = Carbon::now()->subHours(24);

        // Orders that are still "Awaiting Verification" but were rejected over 24 hrs ago
        // and the customer has not yet resubmitted (gcash_rejected_at is set)
        $expired = Order::where('payment_method', 'GCash')
            ->where('payment_status', 'Unpaid')
            ->whereNotNull('gcash_rejected_at')
            ->where('gcash_rejected_at', '<=', $cutoff)
            ->where('status', '!=', 'Cancelled')
            ->get();

        $count = 0;
        foreach ($expired as $order) {
            $order->update([
                'status' => 'Cancelled',
                // Otherwise an order still awaiting approval when it expires
                // stays approval_status='pending' forever (there's no
                // 'cancelled' value in that enum) and keeps showing up as an
                // actionable pending order everywhere that filters on it.
                'approval_status' => $order->approval_status === 'pending' ? 'rejected' : $order->approval_status,
                'notes' => trim(($order->notes ?? '') . "\nAuto-cancelled: GCash proof not resubmitted within 24 hours of rejection."),
            ]);
            $count++;
        }

        $this->info("Cancelled {$count} expired GCash order(s).");

        return Command::SUCCESS;
    }
}
