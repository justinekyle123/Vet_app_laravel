<?php

use App\Models\DogOwner;
use App\Models\Staff;

return [

    /*
    |--------------------------------------------------------------------------
    | Authentication Defaults
    |--------------------------------------------------------------------------
    |
    | The clinic schema has no `users` table: dog owners and staff each carry
    | their own credential, so each gets its own guard. "owner" is the default
    | because the sign-in and registration screens are open to clients.
    |
    */

    'defaults' => [
        'guard' => env('AUTH_GUARD', 'owner'),
        'passwords' => env('AUTH_PASSWORD_BROKER', 'dog_owners'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Authentication Guards
    |--------------------------------------------------------------------------
    |
    | Two session guards, one per account table. Protected routes list both
    | ("auth:owner,staff") so either kind of account can sign in through the
    | same form; the first guard that resolves a user wins.
    |
    */

    'guards' => [
        'owner' => [
            'driver' => 'session',
            'provider' => 'dog_owners',
        ],

        'staff' => [
            'driver' => 'session',
            'provider' => 'staff',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | User Providers
    |--------------------------------------------------------------------------
    |
    | Each provider reads one account table and authenticates it against that
    | row's own `password_hash` column.
    |
    */

    'providers' => [
        'dog_owners' => [
            'driver' => 'eloquent',
            'model' => DogOwner::class,
        ],

        'staff' => [
            'driver' => 'eloquent',
            'model' => Staff::class,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Resetting Passwords
    |--------------------------------------------------------------------------
    |
    | Self-service reset is offered to dog owners only. Staff passwords are
    | reset by an administrator from the staff console, which matches how the
    | clinic already manages its own accounts.
    |
    */

    'passwords' => [
        'dog_owners' => [
            'provider' => 'dog_owners',
            'table' => env('AUTH_PASSWORD_RESET_TOKEN_TABLE', 'password_reset_tokens'),
            'expire' => 60,
            'throttle' => 60,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Password Confirmation Timeout
    |--------------------------------------------------------------------------
    */

    'password_timeout' => env('AUTH_PASSWORD_TIMEOUT', 10800),

];
