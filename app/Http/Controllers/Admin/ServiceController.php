<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SaveServiceRequest;
use App\Models\Service;
use App\Models\ServiceCategory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The clinic's service menu: what the desk can book and bill for.
 *
 * Services are retired rather than deleted, so appointment history that
 * references one keeps its meaning.
 */
class ServiceController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Admin/ServiceCreate', [
            'categories' => $this->categories(),
        ]);
    }

    public function edit(Service $service): Response
    {
        return Inertia::render('Admin/ServiceEdit', [
            'service' => $this->servicePayload($service),
            'categories' => $this->categories(),
        ]);
    }

    public function index(Request $request): Response
    {
        /*
         * The status filter is applied in the query so it spans the whole
         * menu, not just the page currently in view.
         */
        $filter = (string) $request->query('filter', 'all');

        if (! in_array($filter, ['all', 'active', 'retired'], true)) {
            $filter = 'all';
        }

        return Inertia::render('Admin/Services', [
            'services' => Service::query()
                ->with('category:category_id,category_name')
                ->when($filter === 'active', fn (Builder $query) => $query->where('is_active', true))
                ->when($filter === 'retired', fn (Builder $query) => $query->where('is_active', false))
                ->orderBy('service_name')
                ->paginate(10)
                ->withQueryString()
                ->through(fn (Service $service): array => [
                    'id' => $service->service_id,
                    'category_id' => $service->category_id,
                    'category_name' => $service->category?->category_name,
                    'service_name' => $service->service_name,
                    'description' => $service->description,
                    'image_path' => $service->image_path,
                    'duration_minutes' => $service->duration_minutes,
                    'price' => $service->price,
                    'is_active' => $service->is_active,
                ]),
            'filter' => $filter,
            'counts' => [
                'offered' => Service::query()->where('is_active', true)->count(),
                'total' => Service::query()->count(),
            ],
            // The form needs the menu of categories a service can be filed
            // under; the schema makes category_id mandatory.
            'categories' => ServiceCategory::query()
                ->orderBy('category_name')
                ->get(['category_id', 'category_name']),
        ]);
    }

    public function store(SaveServiceRequest $request): RedirectResponse
    {
        $data = $request->safe()->except(['image']);

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('services', 'public');
        }

        Service::create($data);

        return redirect()
            ->route('admin.services.index')
            ->with('status', 'service-created');
    }

    public function update(
        SaveServiceRequest $request,
        Service $service,
    ): RedirectResponse {
        $data = $request->safe()->except(['image']);

        if ($request->hasFile('image')) {
            if ($service->image_path !== null && ! str_starts_with($service->image_path, 'http')) {
                Storage::disk('public')->delete($service->image_path);
            }

            $data['image_path'] = $request->file('image')->store('services', 'public');
        }

        $service->update($data);

        return redirect()
            ->route('admin.services.index')
            ->with('status', 'service-updated');
    }

    /**
     * Retire a service off the booking menu, or bring it back.
     */
    public function toggle(Service $service): RedirectResponse
    {
        $service->update(['is_active' => ! $service->is_active]);

        return redirect()
            ->route('admin.services.index')
            ->with(
                'status',
                $service->is_active
                    ? 'service-activated'
                    : 'service-deactivated',
            );
    }

    /** @return list<array{category_id: int, category_name: string}> */
    private function categories(): array
    {
        return ServiceCategory::query()
            ->orderBy('category_name')
            ->get(['category_id', 'category_name'])
            ->map(fn (ServiceCategory $category): array => [
                'category_id' => $category->category_id,
                'category_name' => $category->category_name,
            ])
            ->all();
    }

    /** @return array<string, mixed> */
    private function servicePayload(Service $service): array
    {
        return [
            'id' => $service->service_id,
            'category_id' => $service->category_id,
            'category_name' => $service->category?->category_name,
            'service_name' => $service->service_name,
            'description' => $service->description,
            'image_path' => $service->image_path,
            'duration_minutes' => $service->duration_minutes,
            'price' => $service->price,
            'is_active' => $service->is_active,
        ];
    }
}
