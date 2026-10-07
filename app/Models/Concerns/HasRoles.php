<?php

namespace App\Models\Concerns;

use App\Enums\StaffRole;

/**
 * Role checks shared by the two account models, `DogOwner` and `Staff`.
 *
 * Access is decided by the records themselves rather than a roles/permissions
 * pivot: the clinic has a small, fixed set of roles, and the schema puts the
 * role directly on the person row. Dog owners report a single implicit
 * "owner" role; staff report whatever `staff.role` holds.
 */
trait HasRoles
{
    /**
     * Every role this account holds.
     *
     * @return list<string>
     */
    abstract public function roles(): array;

    /**
     * Does this account hold the given role?
     */
    public function hasRole(StaffRole|string $role): bool
    {
        $role = $role instanceof StaffRole ? $role->value : $role;

        return in_array($role, $this->roles(), true);
    }

    /**
     * Does this account hold any of the given roles?
     */
    public function hasAnyRole(StaffRole|string ...$roles): bool
    {
        foreach ($roles as $role) {
            if ($this->hasRole($role)) {
                return true;
            }
        }

        return false;
    }

    public function isAdmin(): bool
    {
        return $this->hasRole(StaffRole::Admin);
    }

    public function isOwner(): bool
    {
        return $this->hasRole('owner');
    }
}
