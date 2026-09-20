<?php

use Illuminate\Support\Facades\Storage;

/*
|--------------------------------------------------------------------------
| /storage/{path} when uploads live on Supabase Storage
|--------------------------------------------------------------------------
|
| The app links every upload as /storage/{path}. With a remote "public" disk
| there is no public/storage symlink to answer that, so the route redirects to
| the object's public URL.
*/

function useSupabasePublicDisk(): void
{
    config(['filesystems.disks.public' => [
        'driver' => 's3',
        'key' => 'test-key',
        'secret' => 'test-secret',
        'region' => 'ap-southeast-1',
        'bucket' => 'uploads',
        'endpoint' => 'https://abcdef.supabase.co/storage/v1/s3',
        'url' => 'https://abcdef.supabase.co/storage/v1/object/public/uploads',
        'use_path_style_endpoint' => true,
        'throw' => true,
    ]]);

    Storage::forgetDisk('public');
}

test('an upload path redirects to its public Supabase URL', function () {
    useSupabasePublicDisk();

    $this->get('/storage/gcash_proofs/abc123.jpg')
        ->assertRedirect('https://abcdef.supabase.co/storage/v1/object/public/uploads/gcash_proofs/abc123.jpg')
        ->assertHeader('Cache-Control', 'max-age=86400, public, s-maxage=86400');
});

test('serving an upload does not open a session', function () {
    useSupabasePublicDisk();

    $this->get('/storage/customer-reports/7/evidence.png')
        ->assertRedirect()
        ->assertCookieMissing(config('session.cookie'));
});

test('a path that tries to climb out of the bucket is rejected', function () {
    useSupabasePublicDisk();

    $this->get('/storage/gcash_proofs/../../secret.txt')->assertNotFound();
    $this->get('/storage/..%2F..%2Fsecret.txt')->assertNotFound();
});

test('with the local public disk the route leaves serving to the symlink', function () {
    // Default test config: local public disk, so a missing file is a plain 404.
    $this->get('/storage/gcash_proofs/nope.jpg')->assertNotFound();
});
