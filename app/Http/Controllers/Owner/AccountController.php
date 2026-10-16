<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Http\Requests\Owner\UpdateOwnerAccountRequest;
use App\Models\DogBreed;
use App\Models\DogOwner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
                'profile_photo_url' => $owner->profile_photo_url ? Storage::url($owner->profile_photo_url) : null,
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
                    'photo_url' => $dog->photo_url ? Storage::url($dog->photo_url) : null,
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
        /** @var DogOwner $owner */
        $owner = $request->user();
        
        $validated = $request->validated();

        // Handle profile photo upload
        if ($request->hasFile('profile_photo')) {
            // Delete old photo if exists
            if ($owner->profile_photo_url) {
                Storage::delete($owner->profile_photo_url);
            }

            // Store new photo
            $path = $request->file('profile_photo')->store('profile_photos', 'public');
            $validated['profile_photo_url'] = $path;
        }

        // Remove profile_photo from validated data as it's been processed
        unset($validated['profile_photo']);

        // The login account *is* the client record, so one write covers both.
        $owner->update($validated);

        return redirect()->route('owner.account.edit');
    }
}
