<?php

use App\Models\User;

/*
|--------------------------------------------------------------------------
| Regression tests for the admin/cashier/delivery-boy authorization gap
|--------------------------------------------------------------------------
|
| These three route groups (admin, cashier, delivery-boy) used to be wrapped
| only in 'auth' middleware, with no role check at all, so any logged-in
| user of any role could reach admin/cashier/delivery-boy pages and APIs.
| If one of these route groups ever loses its role middleware again, these
| tests should fail.
*/

test('guest is redirected to login from the admin dashboard', function () {
    $this->get('/admin/dashboard')->assertRedirect('/login');
});

test('a customer cannot reach the admin dashboard', function () {
    $this->actingAs(User::factory()->create());

    $this->get('/admin/dashboard')->assertRedirect(route('customer.dashboard'));
});

test('a cashier cannot reach the admin dashboard', function () {
    $this->actingAs(User::factory()->cashier()->create());

    $this->get('/admin/dashboard')->assertRedirect(route('cashier.dashboard'));
});

test('an unapproved admin is blocked from the admin dashboard', function () {
    $this->actingAs(User::factory()->create(['role' => 'Admin', 'is_approved' => false]));

    $this->get('/admin/dashboard')->assertForbidden();
});

test('an approved super admin can reach the admin dashboard', function () {
    $this->actingAs(User::factory()->superAdmin()->create());

    $this->get('/admin/dashboard')->assertOk();
});

test('an approved admin can reach the admin dashboard', function () {
    $this->actingAs(User::factory()->admin()->create());

    $this->get('/admin/dashboard')->assertOk();
});

test('a customer cannot reach the cashier dashboard', function () {
    $this->actingAs(User::factory()->create());

    $this->get('/cashier/dashboard')->assertForbidden();
});

test('a delivery boy cannot reach the cashier dashboard', function () {
    $this->actingAs(User::factory()->deliveryBoy()->create());

    $this->get('/cashier/dashboard')->assertForbidden();
});

test('a cashier can reach the cashier dashboard', function () {
    $this->actingAs(User::factory()->cashier()->create());

    $this->get('/cashier/dashboard')->assertOk();
});

test('a customer cannot reach the delivery boy dashboard', function () {
    $this->actingAs(User::factory()->create());

    $this->get('/delivery-boy/dashboard')->assertRedirect(route('customer.dashboard'));
});

test('a delivery boy can reach the delivery boy dashboard', function () {
    $this->actingAs(User::factory()->deliveryBoy()->create());

    $this->get('/delivery-boy/dashboard')->assertOk();
});

test('a customer cannot reach the create staff account page', function () {
    $this->actingAs(User::factory()->create());

    $this->get('/admin/staff-accounts/create')->assertRedirect(route('customer.dashboard'));
});

test('a super admin can reach the create staff account page', function () {
    $this->actingAs(User::factory()->superAdmin()->create());

    $this->get('/admin/staff-accounts/create')->assertOk();
});

test('an admin can create a cashier account but not an admin account', function () {
    $this->actingAs(User::factory()->admin()->create());

    $this->post('/admin/staff-accounts', [
        'username' => 'newcashier',
        'full_name' => 'New Cashier',
        'email' => 'newcashier@example.com',
        'role' => 'cashier',
        'password' => 'Password1!',
        'password_confirmation' => 'Password1!',
    ])->assertRedirect(route('admin.staff-accounts.index'));

    $this->assertDatabaseHas('users', [
        'username' => 'newcashier',
        'role' => 'cashier',
        'is_approved' => 1,
    ]);

    $this->post('/admin/staff-accounts', [
        'username' => 'sneakyadmin',
        'full_name' => 'Sneaky Admin',
        'email' => 'sneakyadmin@example.com',
        'role' => 'Admin',
        'password' => 'Password1!',
        'password_confirmation' => 'Password1!',
    ])->assertSessionHasErrors('role');

    $this->assertDatabaseMissing('users', ['username' => 'sneakyadmin']);
});

test('a super admin can create an admin account', function () {
    $this->actingAs(User::factory()->superAdmin()->create());

    $this->post('/admin/staff-accounts', [
        'username' => 'newadmin',
        'full_name' => 'New Admin',
        'email' => 'newadmin@example.com',
        'role' => 'Admin',
        'password' => 'Password1!',
        'password_confirmation' => 'Password1!',
    ])->assertRedirect(route('admin.staff-accounts.index'));

    $this->assertDatabaseHas('users', [
        'username' => 'newadmin',
        'role' => 'Admin',
        'is_approved' => 1,
    ]);
});

test('a customer cannot reach the staff accounts list', function () {
    $this->actingAs(User::factory()->create());

    $this->get('/admin/staff-accounts')->assertRedirect(route('customer.dashboard'));
});

test('an admin can reach the staff accounts list', function () {
    $this->actingAs(User::factory()->admin()->create());

    $this->get('/admin/staff-accounts')->assertOk();
});

test('an admin can deactivate and reactivate a cashier', function () {
    $this->actingAs(User::factory()->admin()->create());
    $cashier = User::factory()->cashier()->create(['is_active' => true]);

    $this->put("/admin/staff-accounts/{$cashier->id}/toggle-active")->assertRedirect();
    expect($cashier->fresh()->is_active)->toBeFalse();

    $this->put("/admin/staff-accounts/{$cashier->id}/toggle-active")->assertRedirect();
    expect($cashier->fresh()->is_active)->toBeTrue();
});

test('an admin cannot deactivate their own account', function () {
    $admin = User::factory()->admin()->create(['is_active' => true]);
    $this->actingAs($admin);

    $this->put("/admin/staff-accounts/{$admin->id}/toggle-active");

    expect($admin->fresh()->is_active)->toBeTrue();
});

test('an admin cannot deactivate another admin, but a super admin can', function () {
    $admin = User::factory()->admin()->create();
    $otherAdmin = User::factory()->admin()->create(['is_active' => true]);

    $this->actingAs($admin)->put("/admin/staff-accounts/{$otherAdmin->id}/toggle-active");
    expect($otherAdmin->fresh()->is_active)->toBeTrue();

    $this->actingAs(User::factory()->superAdmin()->create())
        ->put("/admin/staff-accounts/{$otherAdmin->id}/toggle-active");
    expect($otherAdmin->fresh()->is_active)->toBeFalse();
});

test('an admin can delete a staff account with no activity', function () {
    $this->actingAs(User::factory()->admin()->create());
    $deliveryBoy = User::factory()->deliveryBoy()->create();

    $this->delete("/admin/staff-accounts/{$deliveryBoy->id}")->assertRedirect();

    $this->assertDatabaseMissing('users', ['id' => $deliveryBoy->id]);
});

/*
|--------------------------------------------------------------------------
| Regression tests: cashier POS screen calling admin-only POS API routes
|--------------------------------------------------------------------------
|
| admin/api/products and admin/api/pos/sale used to live inside the same
| route group as the rest of /admin, gated by role:Admin,SuperAdmin plus an
| admin.approval middleware that hard-403s anyone who isn't an approved
| Admin/SuperAdmin. But the cashier POS page (cashier/pos) calls these exact
| admin/api/... endpoints, so no cashier could ever load products or
| complete a sale — CheckRole would redirect them to the cashier dashboard's
| HTML page instead of returning JSON, which broke the frontend's
| response.json() call. If these routes ever get folded back into the
| admin.approval-gated group, these tests should fail.
*/

test('a cashier can load the POS product list', function () {
    $this->actingAs(User::factory()->cashier()->create());

    $this->getJson('/admin/api/products')->assertOk();
});

test('a cashier reaches the POS sale controller instead of being redirected', function () {
    $this->actingAs(User::factory()->cashier()->create());

    // Deliberately empty payload: we only care that the role middleware lets
    // the request through to the controller (a 422 validation response),
    // not that it silently 302-redirects to the cashier dashboard's HTML.
    $this->postJson('/admin/api/pos/sale', [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['items', 'payment_method', 'total_amount']);
});

test('an admin can still load the POS product list and reach the sale controller', function () {
    $this->actingAs(User::factory()->admin()->create());

    $this->getJson('/admin/api/products')->assertOk();
    $this->postJson('/admin/api/pos/sale', [])->assertStatus(422);
});

test('a customer still cannot reach the POS sale controller', function () {
    $this->actingAs(User::factory()->create());

    $this->getJson('/admin/api/products')->assertStatus(302);
    $this->postJson('/admin/api/pos/sale', [])->assertStatus(302);
});
