<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;

/**
 * Verifies an admin-created staff account's email from the link
 * VerifyStaffAccountEmail mailed them — deliberately NOT behind `auth`
 * middleware (unlike Laravel's stock verification.verify route), since the
 * account can't log in until this succeeds. The `signed` middleware on the
 * route plus the explicit hash check below are what keep this safe without
 * requiring a session.
 */
class StaffEmailVerificationController extends Controller
{
    public function __invoke(Request $request, int $id, string $hash): RedirectResponse
    {
        $user = User::findOrFail($id);

        if (! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            abort(403, 'Invalid or expired verification link.');
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            event(new Verified($user));
        }

        return redirect()->route('login')->with('success', 'Email verified! You can now log in.');
    }
}
