<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $this->get('/admin/dashboard')->assertRedirect('/login');
});

test('a customer can visit their own dashboard', function () {
    $this->actingAs(User::factory()->create());

    $this->get('/customer/dashboard')->assertOk();
});
