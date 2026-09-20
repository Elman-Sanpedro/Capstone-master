<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail as BaseVerifyEmail;
use Illuminate\Support\Facades\URL;

/**
 * Points the verification link at a dedicated, un-authenticated route
 * instead of Laravel's stock `verification.verify` — that one sits behind
 * `auth` middleware, which an admin-created staff account can never satisfy
 * since LoginRequest blocks it from logging in until it's verified. This
 * lets the link itself carry proof of identity (the signed URL + hash),
 * exactly like the stock flow, just without requiring a session first.
 */
class VerifyStaffAccountEmail extends BaseVerifyEmail
{
    protected function verificationUrl($notifiable)
    {
        return URL::temporarySignedRoute(
            'staff.verify-email',
            now()->addDays(3),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );
    }
}
