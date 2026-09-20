<?php

use App\Models\User;
use App\Notifications\SendPasswordResetOtp;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

test('reset password link screen can be rendered', function () {
    $response = $this->get('/forgot-password');

    $response->assertStatus(200);
});

test('a password reset otp can be requested', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->post('/forgot-password', ['login' => $user->email])
        ->assertRedirect(route('otp.verify', ['email' => $user->email]));

    Notification::assertSentTo($user, SendPasswordResetOtp::class);
});

test('a password reset otp can be requested by username', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->post('/forgot-password', ['login' => $user->username])
        ->assertRedirect(route('otp.verify', ['email' => $user->email]));

    Notification::assertSentTo($user, SendPasswordResetOtp::class);
});

test('the reset password screen can be rendered with an otp', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->post('/forgot-password', ['login' => $user->email]);

    Notification::assertSentTo($user, SendPasswordResetOtp::class, function ($notification) use ($user) {
        $response = $this->get('/reset-password?email=' . urlencode($user->email) . '&otp=' . $notification->otp);

        $response->assertStatus(200);

        return true;
    });
});

test('password can be reset with a valid otp', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->post('/forgot-password', ['login' => $user->email]);

    Notification::assertSentTo($user, SendPasswordResetOtp::class, function ($notification) use ($user) {
        $response = $this->post('/reset-password', [
            'otp' => $notification->otp,
            'email' => $user->email,
            'password' => 'NewPassword1!',
            'password_confirmation' => 'NewPassword1!',
        ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('login'));

        return true;
    });

    $this->assertTrue(Hash::check('NewPassword1!', $user->fresh()->password));
});

test('password cannot be reset with an invalid otp', function () {
    $user = User::factory()->create();

    DB::table('password_reset_tokens')->insert([
        'email' => $user->email,
        'token' => '111111',
        'created_at' => now(),
        'expires_at' => now()->addMinutes(5),
    ]);

    $response = $this->post('/reset-password', [
        'otp' => '999999',
        'email' => $user->email,
        'password' => 'NewPassword1!',
        'password_confirmation' => 'NewPassword1!',
    ]);

    $response->assertSessionHasErrors('otp');
});
