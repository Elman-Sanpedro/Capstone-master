<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class NewPasswordController extends Controller
{
    /**
     * Show the password reset page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/reset-password', [
            'email' => $request->email,
            'otp' => $request->otp,
        ]);
    }

    /**
     * Handle an incoming new password request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'otp' => 'required|digits:6',
            'email' => 'required|email',
            'password' => [
                'required', 
                'confirmed', 
                'min:8',
                'regex:/[a-z]/',      // at least one lowercase
                'regex:/[A-Z]/',      // at least one uppercase
                'regex:/[0-9]/',      // at least one number
                'regex:/[@$!%*?&.]/',  // at least one special character
            ],
        ], [
            'password.regex' => 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&.).',
            'otp.digits' => 'The OTP must be exactly 6 digits.',
        ]);

        // Find the OTP record
        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('token', $request->otp)
            ->first();

        // Validate OTP
        if (!$resetRecord) {
            throw ValidationException::withMessages([
                'otp' => ['Invalid OTP. Please request a new one.'],
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

        // Find the user
        $user = \App\Models\User::where('email', $request->email)->first();
        
        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['We cannot find a user with that email address.'],
            ]);
        }

        // Reset the password
        $user->forceFill([
            'password' => Hash::make($request->password),
            'remember_token' => Str::random(60),
        ])->save();

        event(new PasswordReset($user));

        // Delete the used OTP
        DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->delete();

        return to_route('login')->with('status', __('Your password has been reset successfully!'));
    }
}
