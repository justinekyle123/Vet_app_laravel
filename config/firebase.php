<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Master Switch
    |--------------------------------------------------------------------------
    |
    | Set FIREBASE_ENABLED=false to stand the Google button down and fall back
    | to the password (Breeze) sign-in screens. The keys below are left in place
    | so turning it back on is a one-line revert rather than a code change.
    |
    */

    'enabled' => filter_var(env('FIREBASE_ENABLED', true), FILTER_VALIDATE_BOOL),

    /*
    |--------------------------------------------------------------------------
    | Web App Configuration
    |--------------------------------------------------------------------------
    |
    | These come from the Firebase console ("Project settings" > "Your apps" >
    | web app config). They are all public values: the browser needs them to
    | talk to Firebase, and they identify the project rather than authorising
    | anything. That is why the same values appear twice in .env, once bare for
    | the server and once under the VITE_ prefix for the browser bundle.
    |
    */

    'api_key' => env('FIREBASE_API_KEY'),

    'auth_domain' => env('FIREBASE_AUTH_DOMAIN'),

    /*
    |--------------------------------------------------------------------------
    | Project ID
    |--------------------------------------------------------------------------
    |
    | The security boundary for server-side verification. A Firebase ID token
    | is only accepted when its audience matches this project, which is what
    | stops a token minted for somebody else's project being replayed here.
    |
    */

    'project_id' => env('FIREBASE_PROJECT_ID'),

    'app_id' => env('FIREBASE_APP_ID'),

    /*
    |--------------------------------------------------------------------------
    | Clock Skew
    |--------------------------------------------------------------------------
    |
    | Tolerance (in seconds) for clock drift between this server and Google when
    | checking the token's exp / iat claims.
    |
    */

    'clock_skew_seconds' => (int) env('FIREBASE_CLOCK_SKEW_SECONDS', 5),

    /*
    |--------------------------------------------------------------------------
    | Google Public Certificates
    |--------------------------------------------------------------------------
    |
    | Firebase ID tokens are signed by Google. This is the published certificate
    | set the signature is checked against, and how long a fetched copy is
    | cached before it is re-fetched.
    |
    */

    'certificates_url' => env(
        'FIREBASE_CERTIFICATES_URL',
        'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
    ),

    'certificates_ttl' => (int) env('FIREBASE_CERTIFICATES_TTL', 3600),

    /*
    |--------------------------------------------------------------------------
    | Post-Bridge Redirect
    |--------------------------------------------------------------------------
    |
    | Where the browser is sent once a Firebase session has been exchanged for a
    | local Laravel session.
    |
    */

    'redirect_to' => env('FIREBASE_REDIRECT_TO', '/dashboard'),

];
