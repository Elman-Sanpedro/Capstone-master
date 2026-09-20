<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // Shared secret for the /api/cron/* endpoints Vercel Cron calls (Vercel sends
    // it as "Authorization: Bearer <CRON_SECRET>" when CRON_SECRET is set).
    'cron' => [
        'secret' => env('CRON_SECRET'),
    ],

    'recaptcha' => [
        // Public key, exposed to the frontend as VITE_RECAPTCHA_SITE_KEY.
        'site_key' => env('RECAPTCHA_SITE_KEY'),
        // Secret key, used server-side only to verify tokens with Google.
        'secret_key' => env('RECAPTCHA_SECRET_KEY'),
    ],

];
