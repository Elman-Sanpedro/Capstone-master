<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @param  string  ...$roles
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        $userRole = Auth::user()->role;

        if (!in_array($userRole, $roles)) {
            // Redirect to appropriate dashboard based on user role
            if ($userRole === 'Customer') {
                return redirect()->route('customer.dashboard');
            } elseif ($userRole === 'delivery_boy') {
                return redirect()->route('delivery-boy.dashboard');
            } elseif ($userRole === 'cashier') {
                return redirect()->route('cashier.dashboard');
            } elseif ($userRole === 'Admin' || $userRole === 'SuperAdmin') {
                return redirect()->route('admin.dashboard');
            }

            // Fallback to home
            return redirect()->route('home');
        }

        return $next($request);
    }
}
