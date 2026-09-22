<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Http\Requests\Owner\SavePetRequest;
use App\Models\Owner;
use App\Models\Pet;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;

/**
 * Lets a dog owner manage the pets under their own account.
 */
class PetController extends Controller
{
    use AuthorizesRequests;

    public function store(SavePetRequest $request): RedirectResponse
    {
        $this->authorize('create', Pet::class);

        $owner = Owner::provisionFor($request->user());

        $owner->pets()->create($request->validated());

        return redirect()->route('owner.account.edit');
    }

    public function update(SavePetRequest $request, Pet $pet): RedirectResponse
    {
        $this->authorize('update', $pet);

        $pet->update($request->validated());

        return redirect()->route('owner.account.edit');
    }
}
