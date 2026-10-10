<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminNotifications;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * The admin console topbar's notification action: clearing the unread badge.
 *
 * The feed itself is shared through Inertia, so the only endpoint is the one
 * that moves the read bookmark.
 */
class NotificationController extends Controller
{
    public function __invoke(
        Request $request,
        AdminNotifications $notifications,
    ): RedirectResponse {
        $notifications->markAllRead($request);

        return back();
    }
}
