<?php

namespace App\Http\Controllers\Admin;

use App\Enums\StaffRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ResetStaffPasswordRequest;
use App\Http\Requests\Admin\SaveStaffRequest;
use App\Models\ClinicInfo;
use App\Models\Staff;
use Illuminate\Http\RedirectResponse;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Staff account management for administrators.
 *
 * Covers adding, editing, and removing the clinic's vets and groomers with
 * their full profile, and resetting a staff member's password.
 */
class StaffController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Staff', [
            'staff' => $this->staffMembers(),
        ]);
    }

    /**
     * The add-a-vet-or-groomer form. Only the two client-facing roles are
     * offered; administrator accounts are provisioned with the clinic.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/StaffCreate', [
            'roles' => $this->roleOptions(),
        ]);
    }

    /**
     * Create a veterinarian or groomer profile.
     *
     * Care-team members do not sign in, so no credential is set: the row is a
     * record their booking is attached to and the pages read from.
     */
    public function store(SaveStaffRequest $request): RedirectResponse
    {
        $data = $request->safe()->except(['image']);

        $data['clinic_id'] = ClinicInfo::current()->clinic_id;

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('staff', 'public');
        }

        Staff::create($data);

        return redirect()
            ->route('admin.staff.index')
            ->with('status', 'staff-created');
    }

    /**
     * The edit form, pre-filled with a member's current profile.
     */
    public function edit(Staff $staff): Response
    {
        return Inertia::render('Admin/StaffEdit', [
            'staff' => $this->staffPayload($staff),
            'roles' => $this->roleOptions(),
        ]);
    }

    /**
     * Update a vet or groomer's profile. No credential is touched here.
     */
    public function update(
        SaveStaffRequest $request,
        Staff $staff,
    ): RedirectResponse {
        $data = $request->safe()->except(['image']);

        if ($request->hasFile('image')) {
            $this->deleteImage($staff);
            $data['image_path'] = $request->file('image')->store('staff', 'public');
        }

        $staff->update($data);

        return redirect()
            ->route('admin.staff.index')
            ->with('status', 'staff-updated');
    }

    /**
     * Remove a vet or groomer from the care team.
     *
     * Their appointments, feedback, and complaints keep their own record: the
     * schema nulls the staff reference on delete, so history is not lost.
     */
    public function destroy(Staff $staff): RedirectResponse
    {
        /*
         * An administrator cannot remove their own account: doing so would
         * lock them out of the console with no way back in. The button is
         * hidden for their own row too, but the guard is what actually holds.
         */
        if ($staff->staff_id === auth()->id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        $this->deleteImage($staff);
        $staff->delete();

        return redirect()
            ->route('admin.staff.index')
            ->with('status', 'staff-deleted');
    }

    public function updatePassword(
        ResetStaffPasswordRequest $request,
        Staff $staff,
    ): RedirectResponse {
        $staff->update(['password_hash' => $request->validated('password')]);

        return redirect()->route('admin.staff.index');
    }

    /**
     * @return LengthAwarePaginator<int, array<string, mixed>>
     */
    private function staffMembers(): LengthAwarePaginator
    {
        return Staff::query()
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->paginate(10)
            ->through(fn (Staff $member): array => [
                'id' => $member->staff_id,
                'name' => $member->fullName(),
                'email' => $member->email,
                'role' => $member->role->value,
                'specialization' => $member->specialization,
                'is_active' => $member->is_active,
                'image' => $member->imageUrl(),
                'created_at' => $member->created_at,
            ]);
    }

    /**
     * The roles the add and edit forms can set.
     *
     * @return list<array{value: string, label: string}>
     */
    private function roleOptions(): array
    {
        return array_map(
            fn (StaffRole $role): array => [
                'value' => $role->value,
                'label' => $role->label(),
            ],
            [StaffRole::Veterinarian, StaffRole::Groomer],
        );
    }

    /**
     * One member in the shape the edit form fills from.
     *
     * @return array<string, mixed>
     */
    private function staffPayload(Staff $staff): array
    {
        return [
            'id' => $staff->staff_id,
            'first_name' => $staff->first_name,
            'last_name' => $staff->last_name,
            'email' => $staff->email,
            'phone_number' => $staff->phone_number,
            'role' => $staff->role->value,
            'specialization' => $staff->specialization,
            'background' => $staff->background,
            'experience_years' => $staff->experience_years,
            'qualifications' => $staff->qualifications,
            'license_number' => $staff->license_number,
            'image_path' => $staff->image_path,
            'is_active' => $staff->is_active,
        ];
    }

    /**
     * Drop a member's uploaded portrait, if it lives on our own disk.
     *
     * Seeded rows point at a full URL, which is not ours to delete.
     */
    private function deleteImage(Staff $staff): void
    {
        if ($staff->image_path !== null && ! str_starts_with($staff->image_path, 'http')) {
            Storage::disk('public')->delete($staff->image_path);
        }
    }
}
