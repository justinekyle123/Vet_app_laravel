<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Http\Requests\Owner\SaveDogRequest;
use App\Models\Dog;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;

/**
 * Lets a dog owner manage the dogs under their own account.
 */
class DogController extends Controller
{
    use AuthorizesRequests;

    public function store(SaveDogRequest $request): RedirectResponse
    {
        $this->authorize('create', Dog::class);

        $request->user()->dogs()->create($request->validated());

        return redirect()->route('owner.account.edit');
    }

    public function update(SaveDogRequest $request, Dog $dog): RedirectResponse
    {
        $this->authorize('update', $dog);

        $dog->update($request->validated());

        return redirect()->route('owner.account.edit');
    }
}
