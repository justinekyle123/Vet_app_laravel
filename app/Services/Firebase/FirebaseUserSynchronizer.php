<?php

namespace App\Services\Firebase;

use App\Enums\UserRole;
use App\Models\Owner;
use App\Models\User;
use RuntimeException;

/**
 * Maps a verified Firebase identity onto a local user row.
 *
 * Local rows must exist because other tables (owners.user_id, and
 * veterinarians.user_id later) have foreign keys into "users". This upserts on
 * first sign-in rather than relying on a webhook, so it is self-healing and
 * needs no queue.
 */
class FirebaseUserSynchronizer
{
    /**
     * @param  array<string, mixed>  $claims  Verified Firebase ID token claims.
     *
     * @throws RuntimeException When the token carries no usable identity.
     */
    public function sync(array $claims): User
    {
        $uid = (string) ($claims['sub'] ?? '');

        if ($uid === '') {
            throw new RuntimeException('Verified Firebase token is missing a "sub" claim.');
        }

        // Google always returns an email, but a Firebase account created with
        // another provider may not have one — so this is checked, not assumed.
        $email = $this->stringClaim($claims, 'email');

        if ($email === null) {
            throw new RuntimeException(
                'Could not determine an email address for the Firebase user.'
            );
        }

        $name = $this->stringClaim($claims, 'name');

        // Prefer an existing Firebase link; otherwise adopt a row previously
        // created through Breeze with the same email instead of duplicating it.
        $user = User::where('firebase_uid', $uid)->first()
            ?? User::where('email', $email)->first();

        $attributes = [
            'firebase_uid' => $uid,
            'email' => $email,
        ];

        if ($name !== null) {
            $attributes['name'] = $name;
        }

        /*
         * Only treat the address as verified when Firebase says it is. A
         * Google identity is verified; an unverified email/password Firebase
         * account is not, and the "verified" middleware gates the protected
         * areas on this column.
         */
        $verified = ($claims['email_verified'] ?? false) === true;

        /*
         * Assigned as a property rather than mass-assigned, because
         * email_verified_at is deliberately absent from the model's $fillable
         * so request input can never set it. (Folding it into the attribute
         * array above would silently drop it for exactly that reason.)
         */
        if ($user) {
            $user->fill($attributes);

            // Never downgrade an address that is already verified.
            if ($verified && $user->email_verified_at === null) {
                $user->email_verified_at = now();
            }

            $user->save();

            return $user;
        }

        // New Firebase identities become dog owners by default. Existing rows
        // are left alone above so a promoted staff member keeps their role.
        $user = new User([
            ...$attributes,
            'name' => $name ?? $email,
        ]);
        $user->role = UserRole::Owner;
        $user->email_verified_at = $verified ? now() : null;
        $user->save();

        Owner::provisionFor($user);

        return $user;
    }

    /**
     * @param  array<string, mixed>  $claims
     */
    private function stringClaim(array $claims, string $key): ?string
    {
        $value = $claims[$key] ?? null;

        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        return trim($value);
    }
}
