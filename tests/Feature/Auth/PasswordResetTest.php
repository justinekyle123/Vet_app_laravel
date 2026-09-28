<?php

use App\Models\DogOwner;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

test('reset password link screen can be rendered', function () {
    $response = $this->get('/forgot-password');

    $response->assertStatus(200);
});

test('reset password link can be requested', function () {
    Notification::fake();

    $owner = DogOwner::factory()->create();

    $this->post('/forgot-password', ['email' => $owner->email]);

    // The owner model is not Laravel-Notifiable: its own `notifications`
    // table is the clinic's log, so the link is mailed to an on-demand route.
    Notification::assertSentOnDemand(ResetPassword::class);
});

test('reset password screen can be rendered', function () {
    Notification::fake();

    $owner = DogOwner::factory()->create();

    $this->post('/forgot-password', ['email' => $owner->email]);

    Notification::assertSentOnDemand(ResetPassword::class, function ($notification) {
        $response = $this->get('/reset-password/'.$notification->token);

        $response->assertStatus(200);

        return true;
    });
});

test('password can be reset with valid token', function () {
    Notification::fake();

    $owner = DogOwner::factory()->create();

    $this->post('/forgot-password', ['email' => $owner->email]);

    Notification::assertSentOnDemand(
        ResetPassword::class,
        function ($notification) use ($owner) {
            $response = $this->post('/reset-password', [
                'token' => $notification->token,
                'email' => $owner->email,
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ]);

            $response
                ->assertSessionHasNoErrors()
                ->assertRedirect(route('login'));

            $this->assertTrue(
                Hash::check(
                    'new-password',
                    $owner->fresh()->password_hash,
                ),
            );

            return true;
        },
    );
});
