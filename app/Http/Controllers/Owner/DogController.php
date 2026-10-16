<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Http\Requests\Owner\SaveDogRequest;
use App\Models\Dog;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;

/**
 * Lets a dog owner manage the dogs under their own account.
 */
class DogController extends Controller
{
    use AuthorizesRequests;

    public function store(SaveDogRequest $request): RedirectResponse
    {
        $this->authorize('create', Dog::class);

        $validated = $request->validated();

        // Handle dog photo upload
        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('dog_photos', 'public');
            $validated['photo_url'] = $path;
        }

        // Remove photo from validated data as it's been processed
        unset($validated['photo']);

        $request->user()->dogs()->create($validated);

        return redirect()->route('owner.account.edit');
    }

    public function update(SaveDogRequest $request, Dog $dog): RedirectResponse
    {
        $this->authorize('update', $dog);

        $validated = $request->validated();

        // Handle dog photo upload
        if ($request->hasFile('photo')) {
            // Delete old photo if exists
            if ($dog->photo_url) {
                Storage::delete($dog->photo_url);
            }

            // Store new photo
            $path = $request->file('photo')->store('dog_photos', 'public');
            $validated['photo_url'] = $path;
        }

        // Remove photo from validated data as it's been processed
        unset($validated['photo']);

        $dog->update($validated);

        return redirect()->route('owner.account.edit');
    }

    public function deactivate(Dog $dog): RedirectResponse
    {
        $this->authorize('update', $dog);

        $dog->update(['is_active' => false]);

        return redirect()
            ->route('owner.account.edit')
            ->with('status', 'dog-deactivated');
    }

    public function activate(Dog $dog): RedirectResponse
    {
        $this->authorize('update', $dog);

        $dog->update(['is_active' => true]);

        return redirect()
            ->route('owner.account.edit')
            ->with('status', 'dog-activated');
    }
}
