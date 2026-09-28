<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Http\Requests\Staff\SaveOwnerRequest;
use App\Models\DogOwner;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Staff-facing management of dog owner records.
 *
 * Available to every staff role. Owners are deactivated rather than deleted so
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
            ->withQueryString();

        return Inertia::render('Staff/Owners/Index', [
            'owners' => $owners,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Staff/Owners/Create');
    }

    public function store(SaveOwnerRequest $request): RedirectResponse
    {
        $owner = DogOwner::create([
            ...$request->validated(),
            // A desk-created record has no password of its own. The value is
            // random rather than blank so nobody can sign in with an empty
            // password; the client can set one through "forgot password".
            'password_hash' => Hash::make(Str::random(40)),
        ]);

        return redirect()
            ->route('owners.show', $owner)
            ->with('status', 'owner-created');
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
