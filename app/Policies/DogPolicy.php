<?php

namespace App\Policies;

use App\Models\Dog;
use App\Models\DogOwner;

class DogPolicy
{
    /**
     * Only dog owners register dogs, and only for themselves.
     */
    public function create(DogOwner $user): bool
    {
        return $user->isOwner();
    }

    /**
     * A dog may only be edited by the account that owns it.
     */
    public function update(DogOwner $user, Dog $dog): bool
    {
        return $user->isOwner() && $dog->owner_id === $user->owner_id;
    }
}
