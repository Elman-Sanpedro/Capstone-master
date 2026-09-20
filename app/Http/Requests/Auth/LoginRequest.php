<?php

namespace App\Http\Requests\Auth;

use App\Services\RecaptchaVerifier;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
            'recaptcha_token' => ['nullable', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        // The "I'm not a robot" checkbox must be checked on every login
        // attempt, on top of the rate limiter above — this stops bots from
        // grinding through credential lists even if they rotate IPs to
        // dodge the per-login-IP throttle.
        if (! app(RecaptchaVerifier::class)->verify($this->input('recaptcha_token'), 'login', $this->ip())) {
            throw ValidationException::withMessages([
                'recaptcha_token' => 'Please check the "I\'m not a robot" box before signing in.',
            ]);
        }

        $loginField = $this->input('login');
        $password = $this->input('password');
        
        // Determine if login field is email or username
        $credentials = [];
        if (filter_var($loginField, FILTER_VALIDATE_EMAIL)) {
            $credentials['email'] = $loginField;
        } else {
            $credentials['username'] = $loginField;
        }
        $credentials['password'] = $password;

        // Attempt authentication with remember functionality
        if (! Auth::attempt($credentials, $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'login' => __('auth.failed'),
            ]);
        }

        // Check if user is active
        $user = Auth::user();
        if (! $user || ! $user->is_active) {
            Auth::logout();
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'login' => 'Your account has been deactivated. Please contact the administrator.',
            ]);
        }

        // Check if user is approved (for admin accounts)
        if ($user->role === 'Admin' && !$user->is_approved) {
            Auth::logout();
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'login' => 'Your admin account is pending approval. Please wait for an existing administrator to approve your account.',
            ]);
        }

        // Customers already prove their email in the OTP step before their
        // account even exists (RegisteredUserController stamps
        // email_verified_at immediately), so this only ever actually blocks
        // an admin-created staff account (StaffAccountController leaves it
        // null) whose owner hasn't clicked the link mailed to them yet.
        if (! $user->hasVerifiedEmail()) {
            Auth::logout();
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'login' => 'Please verify your email before logging in. Check your inbox for the verification link.',
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => __('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('login')).'|'.$this->ip());
    }
}
