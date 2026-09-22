<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Pet;
use App\Models\User;

class PetPolicy
{
    /**
     * Only dog owners register pets, and only for themselves.
     */
    public function create(User $user): bool
    {
        return $user->hasRole(UserRole::Owner);
    }

    /**
     * A pet may only be edited by the account that owns it.
     */
    public function update(User $user, Pet $pet): bool
    {
        return $user->hasRole(UserRole::Owner)
            && $pet->owner()->where('user_id', $user->id)->exists();
    }
}
