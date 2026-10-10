<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\DogOwner;
use App\Services\Portal\PortalNotifications;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * The portal navbar's notification actions.
 *
 * There is only one: clearing the unread badge. Delivery itself is the clinic's
 * job, so the portal never edits a notification's status.
 */
class NotificationController extends Controller
{
    public function markAllRead(
        Request $request,
        PortalNotifications $notifications,
    ): RedirectResponse {
        /** @var DogOwner $owner */
        $owner = $request->user();

        $notifications->markAllRead($owner, $request);

        return back();
    }
}
