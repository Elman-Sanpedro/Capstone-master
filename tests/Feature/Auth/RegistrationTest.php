<?php

use App\Models\User;

test('registration screen can be rendered', function () {
    $response = $this->get('/register');

    $response->assertStatus(200);
});

test('registration is blocked until the email OTP step is completed', function () {
    $response = $this->post('/register', [
        'username' => 'newcustomer',
        'full_name' => 'New Customer',
        'email' => 'newcustomer@example.com',
        'birthdate' => '2000-01-01',
        'password' => 'Password1!',
        'password_confirmation' => 'Password1!',
    ]);

    $response->assertSessionHas('error');
    $this->assertGuest();
    $this->assertDatabaseMissing('users', ['email' => 'newcustomer@example.com']);
});

test('new users can register once their email OTP is verified', function () {
    $email = 'newcustomer@example.com';

    // Registration only proceeds once the email-OTP step (a separate AJAX
    // flow) has flagged this address as verified in the session.
    $response = $this->withSession([
        'email_verified_' . $email => true,
        'email_verified_until' => now()->addMinutes(30),
    ])->post('/register', [
        'username' => 'newcustomer',
        'full_name' => 'New Customer',
        'email' => $email,
        'birthdate' => '2000-01-01',
        'password' => 'Password1!',
        'password_confirmation' => 'Password1!',
    ]);

    // Registration never auto-logs the new user in; it sends them to the
    // login page with a success message instead.
    $this->assertGuest();
    $response->assertRedirect(route('login'));
    $response->assertSessionHas('status');

    $this->assertDatabaseHas('users', [
        'email' => $email,
        'username' => 'newcustomer',
        'role' => 'Customer',
        'is_approved' => 1,
    ]);
});

test('registration fails validation with a weak password', function () {
    $email = 'newcustomer@example.com';

    $response = $this->withSession([
        'email_verified_' . $email => true,
        'email_verified_until' => now()->addMinutes(30),
    ])->post('/register', [
        'username' => 'newcustomer',
        'full_name' => 'New Customer',
        'email' => $email,
        'birthdate' => '2000-01-01',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertSessionHasErrors('password');
    $this->assertDatabaseMissing('users', ['email' => $email]);
});
