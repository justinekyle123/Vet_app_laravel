<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateClinicInfoRequest;
use App\Models\ClinicInfo;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Clinic-wide configuration for administrators: who the clinic is and how to
 * reach it.
 *
 * The dump models this as a single `clinic_info` row, so the screen edits that
 * one record rather than a key/value settings table.
 */
class SettingController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('Admin/Settings', [
            'settings' => $this->payload(ClinicInfo::current()),
        ]);
    }

    public function update(UpdateClinicInfoRequest $request): RedirectResponse
    {
        ClinicInfo::current()->fill($request->validated())->save();

        return redirect()
            ->route('admin.settings.edit')
            ->with('status', 'settings-saved');
    }

    /**
     * Shape the clinic row for the settings form.
     *
     * The time columns come back as "HH:MM:SS" from the database, which the
     * browser's time inputs will not accept, so they are trimmed to "HH:MM".
     *
     * @return array<string, mixed>
     */
    private function payload(ClinicInfo $clinic): array
    {
        return [
            'clinic_name' => $clinic->clinic_name,
            'address_line' => $clinic->address_line,
            'city' => $clinic->city,
            'province' => $clinic->province,
            'zip_code' => $clinic->zip_code,
            'contact_number' => $clinic->contact_number,
            'email' => $clinic->email,
            'opening_time' => substr((string) $clinic->opening_time, 0, 5),
            'closing_time' => substr((string) $clinic->closing_time, 0, 5),
            'days_open' => $clinic->days_open,
            'logo_url' => $clinic->logo_url,
        ];
    }
}
