<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AdminApprovalMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();
        
        if (!$user || ($user->role !== 'Admin' && $user->role !== 'SuperAdmin') || !$user->is_approved) {
            abort(403, 'Unauthorized access. Only approved administrators can access this area.');
        }
        
        return $next($request);
    }
}
