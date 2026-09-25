<?php

namespace App\Services\Firebase;

use Firebase\JWT\JWK;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * The public certificates Google signs Firebase ID tokens with.
 *
 * Google rotates these keys, so they are fetched from the published endpoint
 * and cached rather than pinned in configuration. The cached copy is the raw
 * JWK set — plain arrays and strings — because parsed `Key` objects hold an
 * OpenSSL key resource that cannot be serialised into a cache store.
 */
class GooglePublicKeys
{
    /** Cache key holding the raw JWK set. */
    private const CACHE_KEY = 'firebase.public-keys';

    /**
     * The signing keys, indexed by their `kid` header so a token's key
     * identifier can be matched without trying every certificate.
     *
     * @return array<string, Key>
     */
    public function all(): array
    {
        $jwks = Cache::remember(
            self::CACHE_KEY,
            (int) config('firebase.certificates_ttl'),
            fn (): array => $this->download(),
        );

        return JWK::parseKeySet($jwks, 'RS256');
    }

    /**
     * @return array<string, mixed> The decoded JWK set.
     */
    private function download(): array
    {
        $response = Http::timeout(10)
            ->get((string) config('firebase.certificates_url'));

        if ($response->failed()) {
            throw new RuntimeException(
                'Could not download the Firebase public certificates from Google.'
            );
        }

        $jwks = $response->json();

        if (! is_array($jwks) || empty($jwks['keys'])) {
            throw new RuntimeException(
                'The Firebase public certificate set was empty or malformed.'
            );
        }

        return $jwks;
    }
}
