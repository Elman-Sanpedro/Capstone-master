<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

/*
|--------------------------------------------------------------------------
| Email / username matching must ignore case
|--------------------------------------------------------------------------
|
| MySQL matches these columns case-insensitively and the app relies on it (a
| phone keyboard capitalising "Elman" must still log in as "elman"). SQLite
| compares text case-sensitively, so this only runs against MySQL or
| PostgreSQL (where a citext migration provides the same behaviour).
*/

beforeEach(function () {
    if (DB::connection()->getDriverName() === 'sqlite') {
        $this->markTestSkipped('SQLite compares text case-sensitively.');
    }
});

test('users can log in with their username in a different case', function () {
    $user = User::factory()->create(['username' => 'elmansanpedro']);

    $this->post('/login', ['login' => 'ElmanSanPedro', 'password' => 'password']);

    $this->assertAuthenticatedAs($user);
});

test('users can log in with their email in a different case', function () {
    $user = User::factory()->create(['email' => 'elman@example.com']);

    $this->post('/login', ['login' => 'Elman@Example.COM', 'password' => 'password']);

    $this->assertAuthenticatedAs($user);
});

test('an email or username that differs only by case is reported as taken', function () {
    User::factory()->create(['username' => 'taken_name', 'email' => 'taken@example.com']);

    $validator = Validator::make(
        ['username' => 'TAKEN_NAME', 'email' => 'Taken@Example.com'],
        ['username' => 'unique:users,username', 'email' => 'unique:users,email'],
    );

    expect($validator->fails())->toBeTrue()
        ->and($validator->errors()->keys())->toEqualCanonicalizing(['username', 'email']);
});
