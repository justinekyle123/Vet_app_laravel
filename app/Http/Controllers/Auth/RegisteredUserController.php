<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\DogOwner;
use App\Models\Staff;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * Self-service sign-up is open to dog owners only: staff accounts are
     * provisioned by an administrator.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                // The address is a sign-in identifier for both tables, so it
                // must be free in both: a shared address would make the login
                // form ambiguous.
                Rule::unique(DogOwner::class, 'email'),
                Rule::unique(Staff::class, 'email'),
            ],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        [$firstName, $lastName] = DogOwner::splitName($request->string('name'));

        $owner = DogOwner::create([
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $request->email,
            'password_hash' => Hash::make($request->password),
            // Registration only captures a name and email; the owner fills in
            // the rest of their contact details from the portal.
            'phone_number' => '',
        ]);

        event(new Registered($owner));

        Auth::guard('owner')->login($owner);

        return redirect(route('dashboard', absolute: false));
    }
}
