<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ResetStaffPasswordRequest;
use App\Models\Staff;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Staff account management for administrators.
 *
 * Currently covers resetting a staff member's password; role assignment and
 * deactivation slot in here next.
 */
class StaffController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Staff', [
            'staff' => $this->staffMembers(),
        ]);
    }

    public function updatePassword(
        ResetStaffPasswordRequest $request,
        Staff $staff,
    ): RedirectResponse {
        $staff->update(['password_hash' => $request->validated('password')]);

        return redirect()->route('admin.staff.index');
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function staffMembers(): Collection
    {
        return Staff::query()
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get()
            ->map(fn (Staff $member): array => [
                'id' => $member->staff_id,
                'name' => $member->fullName(),
                'email' => $member->email,
                'role' => $member->role->value,
                'created_at' => $member->created_at,
            ]);
    }
}
