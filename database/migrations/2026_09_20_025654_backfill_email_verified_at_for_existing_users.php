<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Every account created before this migration has email_verified_at = NULL,
// since verification was never enforced at login. Login is about to start
// blocking on it (see LoginRequest::authenticate()), so every pre-existing
// account is grandfathered in as verified here — this migration only
// affects accounts that already existed at the time it ran; every new
// admin-created staff account after this point starts NULL and must
// actually click the link mailed to it.
return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->whereNull('email_verified_at')
            ->update(['email_verified_at' => now()]);
    }

    public function down(): void
    {
        // Intentionally not reversible: we can't tell apart the accounts
        // this backfilled from ones that verified for real after it ran.
    }
};
