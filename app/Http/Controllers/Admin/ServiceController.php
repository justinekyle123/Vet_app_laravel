<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SaveServiceRequest;
use App\Models\Service;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The clinic's service menu: what the desk can book and bill for.
 *
 * Services are retired rather than deleted, so invoice lines and past
 * appointments that reference one keep their meaning.
 */
class ServiceController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Services', [
            'services' => Service::query()
                ->orderBy('name')
                ->get([
                    'id',
                    'name',
                    'description',
                    'duration_minutes',
                    'price',
                    'is_active',
                ]),
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
