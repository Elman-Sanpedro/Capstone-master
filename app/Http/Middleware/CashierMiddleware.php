<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CashierMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        $user = Auth::user();
        
        // Check if user is a cashier and has POS access
        if (!$user->canAccessPOS()) {
            abort(403, 'Unauthorized access. You do not have permission to access the cashier dashboard.');
        }

        // Restrict cashiers from accessing admin routes
        if ($user->isCashier() && $request->is('admin/*')) {
            abort(403, 'Cashiers cannot access admin areas.');
        }

        return $next($request);
    }
}
