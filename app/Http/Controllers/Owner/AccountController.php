<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Http\Requests\Owner\UpdateOwnerAccountRequest;
use App\Models\Owner;
use App\Models\Pet;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The dog owner's own account: contact details plus a read-only view of the
 * pets registered under them.
 */
class AccountController extends Controller
{
    public function edit(Request $request): Response
    {
        $owner = Owner::provisionFor($request->user());

        return Inertia::render('Owner/Account', [
            'owner' => [
                'id' => $owner->id,
                'first_name' => $owner->first_name,
                'last_name' => $owner->last_name,
                'email' => $owner->email,
                'phone' => $owner->phone,
                'alternate_phone' => $owner->alternate_phone,
                'address' => $owner->address,
                'city' => $owner->city,
                'postal_code' => $owner->postal_code,
            ],
            'pets' => $owner->pets()
                ->orderBy('name')
                ->get()
                ->map(fn (Pet $pet) => [
                    'id' => $pet->id,
                    'name' => $pet->name,
                    'species' => $pet->species,
                    'breed' => $pet->breed,
                    'sex' => $pet->sex,
                    'color' => $pet->color,
                    'birth_date' => $pet->birth_date?->toDateString(),
                    'weight_kg' => $pet->weight_kg,
                    'microchip_number' => $pet->microchip_number,
                    'is_neutered' => $pet->is_neutered,
                    'allergies' => $pet->allergies,
                    'is_active' => $pet->is_active,
                ])
                ->all(),
        ]);
    }

    public function update(UpdateOwnerAccountRequest $request): RedirectResponse
    {
        $user = $request->user();
        $owner = Owner::provisionFor($user);
        $data = $request->validated();

        $owner->fill($data)->save();

        // Keep the login account in step with the client record: the display
        // name and email are the same identity shown in the top bar.
        $user->name = trim("{$data['first_name']} {$data['last_name']}");

        if ($user->email !== $data['email']) {
            $user->email = $data['email'];
            $user->email_verified_at = null;
        }

        $user->save();

        return redirect()->route('owner.account.edit');
    }
}
