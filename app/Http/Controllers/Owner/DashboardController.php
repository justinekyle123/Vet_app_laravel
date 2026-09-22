<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The client portal: an owner's pets, upcoming appointments, and invoices.
 *
 * Shown as a styled shell for now. It becomes real data once owner records are
 * linked to login accounts and the pet/appointment models exist.
 */
class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Owner/Dashboard');
    }
}
