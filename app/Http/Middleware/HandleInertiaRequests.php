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
             * Both halves of the Clerk credential are required before the
             * sign-in screens can offer it: the server verifies the session
             * token, the browser needs a publishable key to obtain one.
             */
            'clerk' => [
                'configured' => filled(config('clerk.publishable_key'))
                    && filled(config('clerk.secret_key')),
            ],
        ];
    }
}
