<?php

namespace App\Http\Controllers\FrontDesk;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The front desk's working view: today's bookings, the unpaid queue, and the
 * front-desk tasks the spec describes. Widgets get wired to their models as
 * the booking and payment features are built.
 */
class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('FrontDesk/Dashboard');
    }
}
