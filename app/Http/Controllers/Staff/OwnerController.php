<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Http\Requests\Staff\SaveOwnerRequest;
use App\Models\DogOwner;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Staff-facing management of dog owner records.
 *
 * Available to administrators. Owners are deactivated rather than deleted so
 * their dogs and history stay intact.
 */
class OwnerController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $status = (string) $request->query('status', 'active');

        $owners = DogOwner::query()
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $query) use ($search) {
                    $query->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone_number', 'like', "%{$search}%");
                });
            })
            ->when($status === 'active', fn (Builder $query) => $query->where('is_active', true))
            ->when($status === 'inactive', fn (Builder $query) => $query->where('is_active', false))
            ->withCount('dogs')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate(10)
            ->withQueryString()
            // The list rows are shaped like the show and edit payloads, so the
            // link targets have an `id` rather than the raw `owner_id` column.
            ->through(fn (DogOwner $owner): array => $this->ownerPayload($owner) + [
                'dogs_count' => $owner->dogs_count,
            ]);

        return Inertia::render('Staff/Owners/Index', [
            'owners' => $owners,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    public function show(DogOwner $owner): Response
    {
        return Inertia::render('Staff/Owners/Show', [
            'owner' => $this->ownerPayload($owner) + [
                'created_at' => $owner->created_at,
            ],
            'dogs' => $owner->dogs()
                ->with('breed:breed_id,breed_name')
                ->orderBy('dog_name')
                ->get()
                ->map(fn ($dog): array => [
                    'id' => $dog->dog_id,
                    'dog_name' => $dog->dog_name,
                    'breed' => $dog->breed?->breed_name,
                    'sex' => $dog->sex,
                    'birth_date' => $dog->birth_date?->toDateString(),
                    'is_vaccinated' => $dog->is_vaccinated,
                    'is_active' => $dog->is_active,
                ])
                ->all(),
        ]);
    }

    public function edit(DogOwner $owner): Response
    {
        return Inertia::render('Staff/Owners/Edit', [
            'owner' => $this->ownerPayload($owner),
        ]);
    }

    public function update(SaveOwnerRequest $request, DogOwner $owner): RedirectResponse
    {
        $owner->update($request->validated());

        return redirect()
            ->route('owners.show', $owner)
            ->with('status', 'owner-updated');
    }

    public function deactivate(DogOwner $owner): RedirectResponse
    {
        $owner->update(['is_active' => false]);

        return back()->with('status', 'owner-deactivated');
    }

    public function activate(DogOwner $owner): RedirectResponse
    {
        $owner->update(['is_active' => true]);

        return back()->with('status', 'owner-activated');
    }

    /**
     * The columns the owner forms and detail page render.
     *
     * @return array<string, mixed>
     */
    private function ownerPayload(DogOwner $owner): array
    {
        return [
            'id' => $owner->owner_id,
            'first_name' => $owner->first_name,
            'last_name' => $owner->last_name,
            'email' => $owner->email,
            'phone_number' => $owner->phone_number,
            'address' => $owner->address,
            'is_active' => $owner->is_active,
        ];
    }
}
