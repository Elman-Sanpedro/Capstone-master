<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\SendPasswordResetOtp;
use App\Services\RecaptchaVerifier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    /**
     * Show the password reset link request page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming password reset OTP request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'login' => 'required|string',
            'recaptcha_token' => 'nullable|string',
        ]);

        // This form is unauthenticated and reveals nothing about whether an
        // account exists (see the generic message below), but it still lets
        // anyone trigger an OTP email or probe usernames/emails one at a
        // time. Require a passing reCAPTCHA score before doing anything
        // else, on top of the route's rate limit.
        if (! app(RecaptchaVerifier::class)->verify($request->input('recaptcha_token'), 'forgot_password', $request->ip())) {
            throw ValidationException::withMessages([
                'login' => 'We could not verify this request. Please refresh the page and try again.',
            ]);
        }

        $loginField = $request->input('login');
        $email = null;
        $user = null;

        // Check if the login field is an email or username
        if (filter_var($loginField, FILTER_VALIDATE_EMAIL)) {
            $email = $loginField;
            $user = User::where('email', $email)->first();
        } else {
            // Find user by username and get their email
            $user = User::where('username', $loginField)->first();
            if ($user) {
                $email = $user->email;
            }
        }

        // Only send OTP if we found a user
        if ($user && $email) {
            // Generate 6-digit OTP
            $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            
            // Calculate expiration time (5 minutes from now)
            $expiresAt = now()->addMinutes(5);
            
            // Store OTP in password_reset_tokens table
            DB::table('password_reset_tokens')->where('email', $email)->delete();
            DB::table('password_reset_tokens')->insert([
                'email' => $email,
                'token' => $otp,
                'created_at' => now(),
                'expires_at' => $expiresAt,
            ]);
            
            // Send OTP notification
            $user->notify(new SendPasswordResetOtp($otp));
            
            // Redirect to OTP verification page
            return redirect()->route('otp.verify', [
                'email' => $email,
            ])->with('status', __('We have emailed your password reset OTP!'));
        }

        // Always redirect to OTP verification page for security (don't reveal if user exists)
        return redirect()->route('otp.verify', [
            'email' => $email ?: $loginField,
        ])->with('status', __('If the account exists, a password reset OTP will be sent to the associated email address.'));
    }
}
