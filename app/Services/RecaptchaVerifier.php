<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Verifies Google reCAPTCHA tokens against Google's siteverify endpoint.
 *
 * Written to work with reCAPTCHA v2 (the visible "I'm not a robot"
 * checkbox) — Google's response for a v2 token is just {success: bool},
 * with no "score" or "action" fields. Those fields are checked only when
 * present, so this also works unmodified if the site key is ever swapped
 * for a v3 (invisible, score-based) key instead.
 */
class RecaptchaVerifier
{
    /**
     * Minimum acceptable score (0.0 = very likely a bot, 1.0 = very likely human).
     */
    protected float $minScore = 0.5;

    /**
     * Verify a reCAPTCHA v3 token for the given action.
     *
     * Verification is intentionally skipped (returns true) when
     * RECAPTCHA_SECRET_KEY is not configured, so the app keeps working in
     * environments (local dev, fresh clones) that haven't set up reCAPTCHA
     * keys yet. Once real keys are added to .env, enforcement turns on
     * automatically without any code changes.
     */
    public function verify(?string $token, string $expectedAction, ?string $ip = null): bool
    {
        $secret = config('services.recaptcha.secret_key');

        if (! $secret) {
            Log::warning('RECAPTCHA_SECRET_KEY is not set; skipping reCAPTCHA verification.', [
                'action' => $expectedAction,
            ]);

            return true;
        }

        if (! $token) {
            return false;
        }

        try {
            $response = Http::asForm()
                ->timeout(5)
                ->post('https://www.google.com/recaptcha/api/siteverify', [
                    'secret' => $secret,
                    'response' => $token,
                    'remoteip' => $ip,
                ]);

            $result = $response->json() ?? [];
        } catch (\Throwable $e) {
            // Fail open on network/timeout errors: a Google outage should not
            // lock every legitimate user out of login/registration. The
            // existing rate limiter is still in effect as a backstop.
            Log::error('reCAPTCHA verification request failed: '.$e->getMessage());

            return true;
        }

        if (! ($result['success'] ?? false)) {
            $errors = $result['error-codes'] ?? [];

            // "browser-error" means the visitor's own browser (usually an
            // ad-blocker or privacy extension blocking Google's risk-check
            // requests) couldn't complete token generation — it says
            // nothing about whether the visitor is a bot. Since ad-blockers
            // are common among real customers, treat this as inconclusive
            // rather than locking legitimate users out; every other error
            // (invalid/expired/reused token, wrong secret, etc.) still
            // fails closed below.
            if ($errors === ['browser-error']) {
                Log::warning('reCAPTCHA returned browser-error; allowing request through (likely an ad-blocker, not a bot)', [
                    'action' => $expectedAction,
                ]);

                return true;
            }

            Log::info('reCAPTCHA verification failed', [
                'action' => $expectedAction,
                'errors' => $errors,
            ]);

            return false;
        }

        // v3-only fields: a v2 checkbox response has neither, so these
        // checks simply don't run for it.
        if (array_key_exists('action', $result) && $result['action'] !== $expectedAction) {
            Log::warning('reCAPTCHA action mismatch (possible token replay)', [
                'expected' => $expectedAction,
                'got' => $result['action'],
            ]);

            return false;
        }

        if (array_key_exists('score', $result)) {
            $score = (float) $result['score'];

            if ($score < $this->minScore) {
                Log::info('reCAPTCHA score below threshold', [
                    'action' => $expectedAction,
                    'score' => $score,
                ]);

                return false;
            }
        }

        return true;
    }
}
