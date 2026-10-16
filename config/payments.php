<?php

/*
|--------------------------------------------------------------------------
| Online payments
|--------------------------------------------------------------------------
|
| The clinic takes online payments itself rather than through a payment
| gateway: the owner chooses a channel on the visit they are paying for and
| the payment is recorded against it there and then.
|
| This list is the single source of truth. The portal renders exactly what is
| here, and the server accepts nothing else, so the form and the validation
| cannot drift apart. Adding a channel the clinic signs up for is one entry;
| the matching row in `payment_methods` is created on first use.
|
| `name` is what gets recorded against the payment and shown back to the
| client, so it must read the way the clinic writes it. `icon` picks the
| picture the portal draws: wallet, card, or bank.
|
*/

return [
    'methods' => [
        [
            'name' => 'GCash',
            'description' => 'Pay from your GCash wallet app.',
            'icon' => 'wallet',
        ],
        [
            'name' => 'Maya',
            'description' => 'Pay from your Maya wallet app.',
            'icon' => 'wallet',
        ],
        [
            'name' => 'Card',
            'description' => 'Debit or credit card.',
            'icon' => 'card',
        ],
        [
            'name' => 'Bank Transfer',
            'description' => 'Transfer from your bank app.',
            'icon' => 'bank',
        ],
    ],
];
