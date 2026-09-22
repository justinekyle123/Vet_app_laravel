<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Http\Requests\Staff\SaveOwnerRequest;
use App\Models\Owner;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Staff-facing management of dog owner records.
 *
 * Available to front desk and admin. Owners are deactivated rather than
 * deleted so their pets and history stay intact.
 */
class OwnerController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $status = (string) $request->query('status', 'active');

        $owners = Owner::query()
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $query) use ($search) {
                    $query->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('city', 'like', "%{$search}%");
                });
            })
            ->when($status === 'active', fn (Builder $query) => $query->where('is_active', true))
            ->when($status === 'inactive', fn (Builder $query) => $query->where('is_active', false))
            ->withCount('pets')
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
        $owner = Owner::create($request->validated());

        return redirect()
            ->route('owners.show', $owner)
            ->with('status', 'owner-created');
    }

    public function show(Owner $owner): Response
    {
        return Inertia::render('Staff/Owners/Show', [
            'owner' => $owner->only([
                'id',
                'first_name',
                'last_name',
                'email',
                'phone',
                'alternate_phone',
                'address',
                'city',
                'postal_code',
                'notes',
                'is_active',
                'created_at',
            ]),
            'pets' => $owner->pets()
                ->orderBy('name')
                ->get()
                ->map(fn ($pet) => [
                    'id' => $pet->id,
                    'name' => $pet->name,
                    'species' => $pet->species,
                    'breed' => $pet->breed,
                    'sex' => $pet->sex,
                    'birth_date' => $pet->birth_date?->toDateString(),
                    'is_active' => $pet->is_active,
                ])
                ->all(),
        ]);
    }

    public function edit(Owner $owner): Response
    {
        return Inertia::render('Staff/Owners/Edit', [
            'owner' => $owner->only([
                'id',
                'first_name',
                'last_name',
                'email',
                'phone',
                'alternate_phone',
                'address',
                'city',
                'postal_code',
                'notes',
                'is_active',
            ]),
        ]);
    }

    public function update(SaveOwnerRequest $request, Owner $owner): RedirectResponse
    {
        $owner->update($request->validated());

        return redirect()
            ->route('owners.show', $owner)
            ->with('status', 'owner-updated');
    }

    public function deactivate(Owner $owner): RedirectResponse
    {
        $owner->update(['is_active' => false]);

        return back()->with('status', 'owner-deactivated');
    }

    public function activate(Owner $owner): RedirectResponse
    {
        $owner->update(['is_active' => true]);

        return back()->with('status', 'owner-activated');
    }
}
