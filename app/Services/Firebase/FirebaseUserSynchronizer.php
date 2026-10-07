<?php

namespace App\Services\Firebase;

use App\Enums\StaffRole;
use App\Models\DogOwner;
use App\Models\Staff;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Maps a verified Firebase identity onto a local account row.
 *
 * Accounts live in `dog_owners` and `staff`, and neither table has a column
 * for the Firebase uid, so an identity is matched by email: the same address
 * a staff member or owner already signs in with. A first-time Google sign-in
 * with no matching address becomes a dog owner, since that is the only
 * self-service account the clinic offers.
 */
class FirebaseUserSynchronizer
{
    /**
     * @param  array<string, mixed>  $claims  Verified Firebase ID token claims.
     *
     * @throws RuntimeException When the token carries no usable identity.
     */
    public function sync(array $claims): DogOwner|Staff
    {
        // The subject is required even though it is not persisted: a token
        // without one is malformed, and Google always sends it.
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

        // Prefer an existing account with this address, in either table, so a
        // staff member signing in with Google keeps their role and history.
        $account = DogOwner::where('email', $email)->first()
            ?? Staff::where('email', $email)->first();

        if ($account !== null) {
            if ($account instanceof Staff && $account->role !== StaffRole::Admin) {
                throw new RuntimeException('Only administrator staff accounts can sign in.');
            }

            if ($name !== null) {
                [$firstName, $lastName] = DogOwner::splitName($name);

                $account->first_name = $firstName;
                $account->last_name = $lastName;
                $account->save();
            }

            return $account;
        }

        [$firstName, $lastName] = DogOwner::splitName($name ?? $email);

        return DogOwner::create([
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $email,
            // Firebase owns the credential, so this account has no usable
            // password. The stored value is random rather than blank so it can
            // never be matched by an empty or guessed password.
            'password_hash' => Hash::make(Str::random(40)),
            'phone_number' => '',
        ]);
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
