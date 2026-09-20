<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            // Off: this would register a GET /storage/{path} route (for signed
            // temporary URLs to the private disk, which nothing here uses) that
            // shadows the /storage/{path} route in routes/web.php.
            'serve' => false,
            'throw' => false,
        ],

        // Uploads (payment proofs, delivery photos, report evidence, ...) go to
        // this disk. A serverless host such as Vercel has no persistent disk, so
        // when SUPABASE_URL is set the disk is a public Supabase Storage bucket,
        // reached over its S3-compatible API; otherwise it is storage/app/public.
        // Either way the app keeps linking to /storage/{path} (see routes/web.php).
        'public' => env('SUPABASE_URL') ? [
            'driver' => 's3',
            'key' => env('SUPABASE_S3_KEY'),
            'secret' => env('SUPABASE_S3_SECRET'),
            // Must match the project's region, or request signing is rejected.
            'region' => env('SUPABASE_S3_REGION', 'ap-southeast-1'),
            'bucket' => env('SUPABASE_STORAGE_BUCKET', 'uploads'),
            'endpoint' => env('SUPABASE_S3_ENDPOINT', rtrim(env('SUPABASE_URL'), '/').'/storage/v1/s3'),
            'url' => rtrim(env('SUPABASE_URL'), '/').'/storage/v1/object/public/'.env('SUPABASE_STORAGE_BUCKET', 'uploads'),
            'use_path_style_endpoint' => true,
            'visibility' => 'public',
            // Fail loudly: a silently dropped payment proof is worse than an error.
            'throw' => true,
        ] : [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => env('APP_URL').'/storage',
            'visibility' => 'public',
            'throw' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
