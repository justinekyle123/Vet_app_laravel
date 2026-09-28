<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restricts a route (or route group) to accounts holding one of the roles.
 *
 * Usage: ->middleware('role:admin') or ->middleware('role:admin,front_desk').
 * It expects an authenticated account to already be resolved; pair it with an
 * "auth:owner,staff" middleware rather than using it on its own. Dog owners
 * report the "owner" role, staff report their `staff.role` value.
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
