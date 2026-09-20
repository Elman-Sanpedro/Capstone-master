<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\DailyCashierSummary;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $user = Auth::user();

        // Its own flash key (not the generic 'success' the corner toast watches) so the
        // dedicated centered Welcome Back popup shows once, instead of stacking on top of
        // the small toast that would otherwise also fire off the same 'success' message.
        if ($user->role === 'Customer') {
            return redirect()->route('customer.dashboard')->with('welcomeUser', $user->name);
        } elseif ($user->role === 'delivery_boy') {
            return redirect()->route('delivery-boy.dashboard')->with('welcomeUser', $user->name);
        } elseif ($user->role === 'cashier') {
            return redirect()->route('cashier.dashboard')->with('welcomeUser', $user->name);
        } elseif ($user->role === 'Admin' || $user->role === 'SuperAdmin') {
            return redirect()->route('admin.dashboard')->with('welcomeUser', $user->name);
        }

        // Fallback to home if role is not recognized
        return redirect()->route('home')->with('error', 'Your role is not recognized. Please contact support.');
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $user = Auth::user();

        if ($user && $user->role === 'cashier') {
            $summary = DailyCashierSummary::getTodaySummary($user->id);

            if ($summary && !$summary->isReset()) {
                $summary->markAsReset($user->id, 'Auto-reset on logout');
            }
        }

        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
