<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ResetStaffPasswordRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
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
        User $user,
    ): RedirectResponse {
        // The model's "hashed" cast takes care of hashing the plain value.
        $user->password = $request->validated('password');
        $user->save();

        return redirect()->route('admin.staff.index');
    }

    /**
     * @return Collection<int, User>
     */
    private function staffMembers(): Collection
    {
        return User::query()
            ->whereIn('role', [UserRole::Admin->value, UserRole::FrontDesk->value])
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'created_at']);
    }
}
