<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\OtpVerificationController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\StaffEmailVerificationController;
use App\Http\Controllers\Auth\VerifyEmailController;
use Illuminate\Support\Facades\Route;

// Not wrapped in 'guest' middleware: if a stale session from a previous
// account is still active, RegisteredUserController logs it out itself
// instead of silently bouncing the visitor into that old dashboard.
Route::get('register', [RegisteredUserController::class, 'create'])
    ->name('register');

Route::post('register', [RegisteredUserController::class, 'store']);

// Also kept outside 'guest': these are called mid-registration, so a stale
// session must not block the OTP step needed to finish creating an account.
Route::post('email-verification/send-otp', [EmailVerificationController::class, 'sendOtp'])
    ->middleware('throttle:5,1')
    ->name('email-verification.send-otp');

Route::post('email-verification/verify-otp', [EmailVerificationController::class, 'verifyOtp'])
    ->middleware('throttle:10,1')
    ->name('email-verification.verify-otp');

// Deliberately outside both 'guest' and 'auth': an admin-created staff
// account can't log in yet (that's the whole point), so it can't satisfy
// 'auth', but it also isn't a fresh visitor, so 'guest' doesn't fit either.
// The 'signed' middleware plus the explicit hash check in the controller
// are what keep this safe without a session.
Route::get('staff/verify-email/{id}/{hash}', StaffEmailVerificationController::class)
    ->middleware(['signed', 'throttle:6,1'])
    ->name('staff.verify-email');

Route::middleware('guest')->group(function () {
    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->middleware('throttle:5,1')
        ->name('password.email');

    Route::get('verify-otp', [OtpVerificationController::class, 'create'])
        ->name('otp.verify');

    // A 6-digit OTP has only a million combinations, so this submit route
    // must be rate limited or it's brute-forceable in minutes.
    Route::post('verify-otp', [OtpVerificationController::class, 'store'])
        ->middleware('throttle:10,1')
        ->name('otp.verify.submit');

    Route::get('reset-password', [NewPasswordController::class, 'create'])
        ->name('password.reset');

    // This route independently re-checks the OTP against the database
    // (it doesn't just trust that the visitor already passed verify-otp
    // above), so it's just as brute-forceable as that route and needs the
    // same rate limit.
    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->middleware('throttle:10,1')
        ->name('password.store');
});

Route::get('login', [AuthenticatedSessionController::class, 'create'])
    ->name('login');

Route::post('login', [AuthenticatedSessionController::class, 'store']);

Route::middleware('auth')->group(function () {
    Route::get('verify-email', EmailVerificationPromptController::class)
        ->name('verification.notice');

    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
        ->name('password.confirm');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
