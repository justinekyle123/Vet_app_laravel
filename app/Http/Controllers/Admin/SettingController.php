<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSettingsRequest;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Clinic-wide configuration for administrators: who the clinic is, how to reach
 * it, and the defaults the desk books against.
 */
class SettingController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('Admin/Settings', [
            'settings' => Setting::values(),
        ]);
    }

    public function update(UpdateSettingsRequest $request): RedirectResponse
    {
        Setting::putValues($request->validated());

        return redirect()
            ->route('admin.settings.edit')
            ->with('status', 'settings-saved');
    }
}
