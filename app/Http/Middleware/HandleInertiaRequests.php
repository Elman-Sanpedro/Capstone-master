<?php

namespace App\Http\Middleware;

use App\Models\Inventory;
use App\Models\Order;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $user = $request->user();
        $cashierPendingCount = null;
        if ($user && $user->role === 'cashier') {
            // Excludes Cancelled orders — a rejected order can be left with a
            // stale 'Awaiting Verification' payment_status (rejection only
            // ever touches approval_status/status), which would otherwise
            // inflate this badge with orders that no longer need anything
            // from the cashier.
            $cashierPendingCount = Order::where('payment_status', 'Awaiting Verification')
                ->where('status', '!=', 'Cancelled')
                ->count();
        }
        $adminPendingCount = null;
        $adminLowStockCount = null;
        if ($user && in_array($user->role, ['Admin', 'SuperAdmin'], true)) {
            $adminPendingCount = Order::where('approval_status', 'pending')->count();
            $adminLowStockCount = Inventory::where('current_quantity', '<=', DB::raw('min_stock_level'))->count();
        }

        return array_merge(parent::share($request), [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $user,
            ],
            'cashier_pending_count' => $cashierPendingCount,
            'admin_pending_count' => $adminPendingCount,
            'admin_low_stock_count' => $adminLowStockCount,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'welcomeUser' => fn () => $request->session()->get('welcomeUser'),
            ],
        ]);
    }
}
