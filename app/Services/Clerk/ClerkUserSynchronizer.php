<?php

namespace App\Services\Clerk;

use App\Enums\UserRole;
use App\Models\Owner;
use App\Models\User;
use Clerk\Backend\ClerkBackend;
use Illuminate\Support\Facades\Log;
use stdClass;
use Throwable;

/**
 * Maps a verified Clerk identity onto a local user row.
 *
 * Local rows must exist because other tables (veterinarians.user_id) have
 * foreign keys into "users". This upserts on first sign-in rather than
 * relying on a webhook, so it is self-healing and needs no queue.
 */
class ClerkUserSynchronizer
{
    public function sync(stdClass $claims): User
    {
        $clerkId = (string) ($claims->sub ?? '');

        if ($clerkId === '') {
            throw new \RuntimeException('Verified Clerk token is missing a "sub" claim.');
        }

        $email = $claims->email ?? null;
        $name = null;

        // Default v2 session tokens are slim and may omit the email, so fall
        // back to the Backend API for the authoritative profile.
        if (empty($email)) {
            [$email, $name] = $this->fetchProfile($clerkId);
        }

        if (empty($email)) {
            throw new \RuntimeException('Could not determine an email address for the Clerk user.');
        }

        // Prefer an existing Clerk link; otherwise adopt a row previously
        // created through Breeze with the same email instead of duplicating.
        $user = User::where('clerk_id', $clerkId)->first()
            ?? User::where('email', $email)->first();

        $attributes = [
            'clerk_id' => $clerkId,
            'email' => $email,
            'email_verified_at' => $user?->email_verified_at ?? now(),
        ];

        if ($name) {
            $attributes['name'] = $name;
        }

        if ($user) {
            $user->fill($attributes)->save();

            return $user;
        }

        // New Clerk identities become dog owners by default. Existing rows
        // are left alone above so a promoted staff member keeps their role.
        $user = new User([
            ...$attributes,
            'name' => $name ?: $email,
        ]);
        $user->role = UserRole::Owner;
        $user->save();

        Owner::provisionFor($user);

        return $user;
    }

    /**
     * @return array{0: ?string, 1: ?string} Primary email and display name.
     */
    private function fetchProfile(string $clerkId): array
    {
        try {
            $sdk = ClerkBackend::builder()
                ->setSecurity(config('clerk.secret_key'))
                ->build();

            $profile = $sdk->users->get($clerkId)->user;

            if ($profile === null) {
                return [null, null];
            }

            $primary = $profile->primaryEmailAddressId;
            $email = null;

            foreach ($profile->emailAddresses as $address) {
                if ($primary !== null && $address->id === $primary) {
                    $email = $address->emailAddress;
                    break;
                }
            }

            $email ??= $profile->emailAddresses[0]->emailAddress ?? null;

            $name = trim(($profile->firstName ?? '').' '.($profile->lastName ?? ''));

            return [$email, $name !== '' ? $name : $profile->username];
        } catch (Throwable $e) {
            // Never block a sign-in because the profile lookup failed; the
            // token was already verified.
            Log::warning('Clerk profile lookup failed.', [
                'clerk_id' => $clerkId,
                'exception' => $e->getMessage(),
            ]);

            return [null, null];
        }
    }
}
