<?php

/*
|--------------------------------------------------------------------------
| Online booking
|--------------------------------------------------------------------------
|
| Whether dog owners may request visits from the portal themselves.
|
| Owners use the portal booking wizard to choose a service, dog, slot, and
| payment proof before sending the request to the front desk.
|
| Set PORTAL_BOOKING_ENABLED=false in .env to temporarily close online
| booking. Both the page and the endpoint read this one switch.
|
*/

return [
    'online' => env('PORTAL_BOOKING_ENABLED', true),

    /*
    |----------------------------------------------------------------------
    | Clinic wall clock
    |----------------------------------------------------------------------
    |
    | The clinic's own timezone. Opening hours are written on the clinic's
    | clock, so "has this slot already gone?" has to be answered on that
    | same clock rather than the server's. The application runs in UTC, so
    | without this a visit at 6pm in Quezon City would still be offered
    | today's earlier slots.
    |
    */
    'timezone' => env('CLINIC_TIMEZONE', 'Asia/Manila'),
];
