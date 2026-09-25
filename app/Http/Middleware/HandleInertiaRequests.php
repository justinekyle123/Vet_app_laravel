<?php

namespace App\Http\Middleware;

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
                'user' => $request->user(),
            ],
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
}
