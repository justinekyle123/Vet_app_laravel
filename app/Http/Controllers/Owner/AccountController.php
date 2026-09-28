<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Http\Requests\Owner\UpdateOwnerAccountRequest;
use App\Models\DogBreed;
use App\Models\DogOwner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The dog owner's own account: contact details plus the dogs registered under
 * them.
 */
class AccountController extends Controller
{
    public function edit(Request $request): Response
    {
        /** @var DogOwner $owner */
        $owner = $request->user();

        return Inertia::render('Owner/Account', [
            'owner' => [
                'id' => $owner->owner_id,
                'first_name' => $owner->first_name,
                'last_name' => $owner->last_name,
                'email' => $owner->email,
                'phone_number' => $owner->phone_number,
                'address' => $owner->address,
            ],
            'dogs' => $owner->dogs()
                ->with('breed:breed_id,breed_name')
                ->orderBy('dog_name')
                ->get()
                ->map(fn ($dog): array => [
                    'id' => $dog->dog_id,
                    'dog_name' => $dog->dog_name,
                    'breed_id' => $dog->breed_id,
                    'breed' => $dog->breed?->breed_name,
                    'sex' => $dog->sex,
                    'color' => $dog->color,
                    'birth_date' => $dog->birth_date?->toDateString(),
                    'weight_kg' => $dog->weight_kg,
                    'is_vaccinated' => $dog->is_vaccinated,
                    'photo_url' => $dog->photo_url,
                    'is_active' => $dog->is_active,
                ])
                ->all(),
            // The form files each dog under a breed from the shared list.
            'breeds' => DogBreed::query()
                ->orderBy('breed_name')
                ->get(['breed_id', 'breed_name']),
        ]);
    }

    public function update(UpdateOwnerAccountRequest $request): RedirectResponse
    {
        // The login account *is* the client record, so one write covers both.
        $request->user()->update($request->validated());

        return redirect()->route('owner.account.edit');
    }
}
