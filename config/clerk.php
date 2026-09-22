<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Clerk API Keys
    |--------------------------------------------------------------------------
    |
    | The publishable key is safe to expose to the browser and is passed to the
    | React SDK. The secret key must never leave the server: it is used to
    | fetch Clerk's JWKS and to look users up through the Backend API.
    |
    */

    'publishable_key' => env('CLERK_PUBLISHABLE_KEY'),

    'secret_key' => env('CLERK_SECRET_KEY'),

    /*
    |--------------------------------------------------------------------------
    | Authorized Parties
    |--------------------------------------------------------------------------
    |
    | Allowlist of origins checked against the token's "azp" claim. Without
    | this, a token minted for a different site could be replayed against this
    | backend. Comma-separate multiple origins.
    |
    */

    'authorized_parties' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('CLERK_AUTHORIZED_PARTIES', env('APP_URL', 'http://localhost')))
    ))),

    /*
    |--------------------------------------------------------------------------
    | Clock Skew
    |--------------------------------------------------------------------------
    |
    | Tolerance (in milliseconds) for clock drift between this server and
    | Clerk when validating the token's exp/nbf claims.
    |
    */

    'clock_skew_ms' => (int) env('CLERK_CLOCK_SKEW_MS', 5000),

    /*
    |--------------------------------------------------------------------------
    | Post-Bridge Redirect
    |--------------------------------------------------------------------------
    |
    | Where the browser is sent once a Clerk session has been exchanged for a
    | local Laravel session.
    |
    */

    'redirect_to' => env('CLERK_REDIRECT_TO', '/dashboard'),

];
