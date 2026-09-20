<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;

/*
|--------------------------------------------------------------------------
| /api/cron/gcash-cancel-expired (called by Vercel Cron)
|--------------------------------------------------------------------------
|
| Vercel has no artisan scheduler, so its cron hits this endpoint instead.
| Vercel authenticates itself with "Authorization: Bearer <CRON_SECRET>".
*/

function gcashOrderRejected(int $hoursAgo): int
{
    return DB::table('orders')->insertGetId([
        'user_id' => User::factory()->create()->id,
        'status' => 'Pending',
        'payment_method' => 'GCash',
        'payment_status' => 'Unpaid',
        'approval_status' => 'pending',
        'gcash_rejected_at' => now()->subHours($hoursAgo),
    ], 'order_id');
}

test('it refuses a request without the secret', function () {
    config(['services.cron.secret' => 'top-secret']);

    $this->getJson('/api/cron/gcash-cancel-expired')->assertUnauthorized();
});

test('it refuses a wrong secret', function () {
    config(['services.cron.secret' => 'top-secret']);

    $this->withHeader('Authorization', 'Bearer nope')
        ->getJson('/api/cron/gcash-cancel-expired')
        ->assertUnauthorized();
});

test('it refuses everything while no secret is configured', function () {
    config(['services.cron.secret' => null]);

    // An empty "Bearer " must not match an unset secret.
    $this->withHeader('Authorization', 'Bearer ')
        ->getJson('/api/cron/gcash-cancel-expired')
        ->assertUnauthorized();
});

test('with the secret it cancels GCash orders rejected over 24 hours ago', function () {
    config(['services.cron.secret' => 'top-secret']);

    $expired = gcashOrderRejected(25);
    $stillInTime = gcashOrderRejected(2);

    $this->withHeader('Authorization', 'Bearer top-secret')
        ->getJson('/api/cron/gcash-cancel-expired')
        ->assertOk()
        ->assertJsonPath('message', 'Cancelled 1 expired GCash order(s).');

    expect(DB::table('orders')->where('order_id', $expired)->value('status'))->toBe('Cancelled')
        ->and(DB::table('orders')->where('order_id', $stillInTime)->value('status'))->toBe('Pending');
});
