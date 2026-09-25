<?php

namespace App\Services\Firebase;

use Firebase\JWT\JWT;
use RuntimeException;
use UnexpectedValueException;

/**
 * Verifies a Firebase ID token and returns its claims.
 *
 * The signature is checked against Google's published certificates, and the
 * `aud` / `iss` / `sub` claims are then pinned to this project — a token is
 * only trusted if it was minted for this Firebase project, which is what stops
 * a token issued to somebody else's project being replayed here.
 *
 * Expiry and not-before are handled by the JWT library; the configured clock
 * skew is applied as leeway so a little drift between this server and Google
 * does not reject an otherwise valid token.
 */
class FirebaseAuthenticator
{
    public function __construct(private readonly GooglePublicKeys $publicKeys) {}

    /**
     * @return array<string, mixed> The verified token claims.
     *
     * @throws UnexpectedValueException When the signature, audience, issuer,
     *                                  subject or expiry fails.
     */
    public function verify(string $token): array
    {
        $projectId = (string) config('firebase.project_id');

        if ($projectId === '') {
            throw new RuntimeException(
                'Firebase is not configured: FIREBASE_PROJECT_ID is missing.'
            );
        }

        $claims = $this->decode($token);

        $this->assertBelongsToThisProject($claims, $projectId);

        return $claims;
    }

    /**
     * @return array<string, mixed>
     */
    private function decode(string $token): array
    {
        // The library's leeway is static, so it is set for this call only and
        // restored afterwards to avoid leaking into unrelated code.
        $previousLeeway = JWT::$leeway;
        JWT::$leeway = (int) config('firebase.clock_skew_seconds');

        try {
            return (array) JWT::decode($token, $this->publicKeys->all());
        } finally {
            JWT::$leeway = $previousLeeway;
        }
    }

    /**
     * @param  array<string, mixed>  $claims
     */
    private function assertBelongsToThisProject(array $claims, string $projectId): void
    {
        if (($claims['aud'] ?? null) !== $projectId) {
            throw new UnexpectedValueException(
                'The Firebase token was issued for a different project.'
            );
        }

        if (($claims['iss'] ?? null) !== "https://securetoken.google.com/{$projectId}") {
            throw new UnexpectedValueException(
                'The Firebase token has an unexpected issuer.'
            );
        }

        if (empty($claims['sub']) || ! is_string($claims['sub'])) {
            throw new UnexpectedValueException(
                'The Firebase token is missing a subject (uid).'
            );
        }
    }
}
