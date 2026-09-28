<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SaveServiceRequest;
use App\Models\Service;
use App\Models\ServiceCategory;
use Illuminate\Http\RedirectResponse;
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
    public function index(): Response
    {
        return Inertia::render('Admin/Services', [
            'services' => Service::query()
                ->with('category:category_id,category_name')
                ->orderBy('service_name')
                ->get()
                ->map(fn (Service $service): array => [
                    'id' => $service->service_id,
                    'category_id' => $service->category_id,
                    'category_name' => $service->category?->category_name,
                    'service_name' => $service->service_name,
                    'description' => $service->description,
                    'duration_minutes' => $service->duration_minutes,
                    'price' => $service->price,
                    'is_active' => $service->is_active,
                ]),
            // The form needs the menu of categories a service can be filed
            // under; the schema makes category_id mandatory.
            'categories' => ServiceCategory::query()
                ->orderBy('category_name')
                ->get(['category_id', 'category_name']),
        ]);
    }

    public function store(SaveServiceRequest $request): RedirectResponse
    {
        Service::create($request->validated());

        return redirect()
            ->route('admin.services.index')
            ->with('status', 'service-created');
    }

    public function update(
        SaveServiceRequest $request,
        Service $service,
    ): RedirectResponse {
        $service->update($request->validated());

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
}
