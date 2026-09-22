<?php

namespace App\Services\Clerk;

use Clerk\Backend\Helpers\Jwks\TokenVerificationException;
use Clerk\Backend\Helpers\Jwks\VerifyToken;
use Clerk\Backend\Helpers\Jwks\VerifyTokenOptions;
use stdClass;

/**
 * Verifies a Clerk session token and returns its claims.
 *
 * Signature verification happens against Clerk's JWKS, which the SDK fetches
 * and caches itself. The "azp" claim is checked against a configured
 * allowlist so a token minted for another origin cannot be replayed here.
 */
class ClerkAuthenticator
{
    /**
     * @return stdClass The verified token claims (sub, azp, exp, ...).
     *
     * @throws TokenVerificationException When the signature, issuer,
     *                                    audience, party or expiry fails.
     */
    public function verify(string $token): stdClass
    {
        return VerifyToken::verifyToken($token, $this->options());
    }

    private function options(): VerifyTokenOptions
    {
        return new VerifyTokenOptions(
            secretKey: config('clerk.secret_key'),
            authorizedParties: config('clerk.authorized_parties'),
            clockSkewInMs: (int) config('clerk.clock_skew_ms'),
        );
    }
}
