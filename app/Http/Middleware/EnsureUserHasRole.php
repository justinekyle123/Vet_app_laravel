<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restricts a route (or route group) to users holding one of the given roles.
 *
 * Usage: ->middleware('role:admin') or ->middleware('role:front_desk,admin').
 * It expects an authenticated user to already be resolved; pair it with the
 * "auth" middleware rather than using it on its own.
 */
class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if ($user === null) {
            abort(401);
        }

        if (! $user->hasAnyRole(...$roles)) {
            abort(403, 'You do not have access to this area.');
        }

        return $next($request);
    }
}
