<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class OtpVerificationController extends Controller
{
    /**
     * Show the OTP verification page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/verify-otp', [
            'email' => $request->email,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Verify the OTP and redirect to password reset.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|digits:6',
        ], [
            'otp.digits' => 'The OTP must be exactly 6 digits.',
        ]);

        // Find the OTP record
        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('token', $request->otp)
            ->first();

        // Validate OTP exists
        if (!$resetRecord) {
            throw ValidationException::withMessages([
                'otp' => ['Invalid OTP. Please check your email and try again.'],
            ]);
        }

        // Check if OTP has expired
        if ($resetRecord->expires_at && now()->gt($resetRecord->expires_at)) {
            DB::table('password_reset_tokens')
                ->where('email', $request->email)
                ->delete();
            
            throw ValidationException::withMessages([
                'otp' => ['This OTP has expired. Please request a new one.'],
            ]);
        }

        // OTP is valid, redirect to password reset page
        return redirect()->route('password.reset', [
            'email' => $request->email,
            'otp' => $request->otp,
        ])->with('status', __('OTP verified successfully. Please enter your new password.'));
    }
}
