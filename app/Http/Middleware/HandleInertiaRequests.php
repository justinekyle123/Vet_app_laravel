<?php

namespace App\Http\Middleware;

use App\Models\DogOwner;
use App\Services\Portal\PortalNotifications;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                /*
                 * The two account models are shaped into one contract here so
                 * every page can read `name`, `email`, and `role` without
                 * caring which table the signed-in account came from.
                 */
                'user' => $this->authUser($request),
            ],
            /*
             * The portal navbar's notification feed. Only dog owners have one,
             * so it is null for guests and staff rather than an empty shell.
             */
            'portal' => $this->portalProps($request),
            /*
             * Both halves of the Firebase setup are required before the
             * sign-in screens can offer Google: the server needs a project id
             * to verify tokens against, and the browser needs a web app config
             * to obtain one. The FIREBASE_ENABLED switch folds in on top of
             * that, so standing the integration down needs no change to keys.
             */
            'firebase' => [
                'enabled' => (bool) config('firebase.enabled'),
                'configured' => (bool) config('firebase.enabled')
                    && filled(config('firebase.project_id'))
                    && filled(config('firebase.api_key')),
            ],
        ];
    }

    /**
     * The signed-in account, flattened to the shape the pages expect.
     *
     * @return array<string, mixed>|null
     */
    private function authUser(Request $request): ?array
    {
        $user = $request->user();

        if ($user === null) {
            return null;
        }

        return [
            'id' => $user->getAuthIdentifier(),
            'name' => $user->fullName(),
            'email' => $user->email,
            // Owners report the single implicit "owner" role; staff report
            // whatever their `staff.role` column holds.
            'role' => $user->isOwner() ? 'owner' : $user->role->value,
        ];
    }

    /**
     * The owner portal's shared state, or null when nobody is signed in as one.
     *
     * @return array<string, mixed>|null
     */
    private function portalProps(Request $request): ?array
    {
        $user = $request->user();

        if (! $user instanceof DogOwner) {
            return null;
        }

        $notifications = app(PortalNotifications::class);

        return [
            'notifications' => $notifications->shared($user),
            'unreadNotifications' => $notifications->unreadCount($user),
        ];
    }
}
