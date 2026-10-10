<?php

namespace App\Services\Portal;

use App\Enums\StaffRole;
use App\Models\Service;
use App\Models\Staff;
use Illuminate\Support\Collection;

/**
 * The clinic's client-facing staff: veterinarians and groomers.
 *
 * Administrators never appear — they are not part of the care team — so the
 * landing page and the owner portal both read the same list instead of each
 * writing their own filter. The list is ordered the way the marketing page
 * presents it: veterinarians first, then groomers, each group by surname.
 */
class CareTeam
{
    /** The roles that make up the care team, in display order. */
    private const ROLES = [
        StaffRole::Veterinarian->value,
        StaffRole::Groomer->value,
    ];

    /**
     * Every active member of the care team.
     *
     * @return Collection<int, Staff>
     */
    public function all(): Collection
    {
        return Staff::query()
            ->where('is_active', true)
            ->whereIn('role', self::ROLES)
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get()
            ->sortBy(fn (Staff $member): int => (int) array_search($member->role->value, self::ROLES, true))
            ->values();
    }

    /**
     * Who the clinic can book for a service.
     *
     * Grooming is handled by groomers; every other discipline is medical, so a
     * veterinarian takes it. The rule lives on the service so the portal and
     * the booking flow agree on it.
     *
     * @return Collection<int, Staff>
     */
    public function forService(Service $service): Collection
    {
        $role = $service->providerRole();

        return $this->all()
            ->filter(fn (Staff $member): bool => $member->role === $role)
            ->values();
    }

    /**
     * One member in the shape both pages render.
     *
     * @return array<string, mixed>
     */
    public function present(Staff $member): array
    {
        return [
            'id' => $member->staff_id,
            'name' => $member->fullName(),
            'role' => $member->role->label(),
            'role_value' => $member->role->value,
            'specialization' => $member->specialization,
            'background' => $member->background,
            'experience_years' => $member->experience_years,
            'qualifications' => $member->qualifications,
            'license_number' => $member->license_number,
            'image' => $member->imageUrl(),
        ];
    }

    /**
     * The whole care team, presented.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function presentAll(): Collection
    {
        return $this->all()->map(fn (Staff $member): array => $this->present($member));
    }
}
