<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

/*
|--------------------------------------------------------------------------
| Settings > Backup on PostgreSQL
|--------------------------------------------------------------------------
|
| SHOW TABLES / SHOW CREATE TABLE only exist on MySQL, so PostgreSQL gets its
| own data-only dump. Skipped on other drivers.
*/

beforeEach(function () {
    // Set before the skip below: afterEach runs even for a skipped test.
    // The controller also keeps a copy in base_path('backup') when it can.
    $this->backupDirExisted = is_dir(base_path('backup'));

    if (DB::connection()->getDriverName() !== 'pgsql') {
        $this->markTestSkipped('Needs a PostgreSQL connection.');
    }
});

afterEach(function () {
    if (! ($this->backupDirExisted ?? true)) {
        File::deleteDirectory(base_path('backup'));
    }
});

test('an admin downloads a data backup ordered parents-first', function () {
    $admin = User::factory()->superAdmin()->create(['username' => 'backup_admin']);
    DB::table('orders')->insert(['user_id' => $admin->id, 'status' => 'Pending']);

    $response = $this->actingAs($admin)->post(route('profile.backup'));

    $response->assertOk()->assertDownload();

    $sql = $response->streamedContent();

    expect($sql)
        ->toContain('insert into "users"')
        ->toContain('backup_admin')
        ->toContain('setval(pg_get_serial_sequence(\'"users"\', \'id\')')
        ->not->toContain('insert into "sessions"');

    // "orders" points at "users" through user_id, so users must be loaded first.
    expect(strpos($sql, 'insert into "users"'))->toBeLessThan(strpos($sql, 'insert into "orders"'));
});

test('a customer cannot download a backup', function () {
    // CheckRole sends a wrong-role user back to their own dashboard.
    $this->actingAs(User::factory()->create())
        ->post(route('profile.backup'))
        ->assertRedirect(route('customer.dashboard'))
        ->assertHeaderMissing('Content-Disposition');
});
