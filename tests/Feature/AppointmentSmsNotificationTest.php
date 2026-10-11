<?php

use App\Models\Appointment;
use App\Models\AppointmentStatus;
use App\Models\Dog;
use App\Models\DogOwner;
use App\Models\Notification;
use App\Models\Service;
use App\Models\Staff;
use Illuminate\Support\Facades\Http;

/*
|--------------------------------------------------------------------------
| Test helpers
|--------------------------------------------------------------------------
|
| Names are prefixed so they cannot collide with helpers other feature test
| files declare in the same global namespace.
|
*/

/** Point the app at a fake-but-configured Android SMS Gateway. */
function configureSmsGateway(): void
{
    config([
        'services.sms_gateway.enabled' => true,
        'services.sms_gateway.username' => 'gateway-user',
        'services.sms_gateway.password' => 'gateway-secret',
        'services.sms_gateway.url' => 'https://sms.test/api/3rdparty/v1',
    ]);
}

/** The single notification logged for a visit, or null when none was. */
function smsNoticeFor(Appointment $appointment): ?Notification
{
    return Notification::query()
        ->where('appointment_id', $appointment->appointment_id)
        ->first();
}

/** A visit for a fresh owner and dog, in the given state. */
function smsBookVisit(string $statusName, string $date, string $phone = '09171234567'): Appointment
{
    $owner = DogOwner::factory()->create(['phone_number' => $phone]);
    $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);

    return Appointment::create([
        'owner_id' => $owner->owner_id,
        'dog_id' => $dog->dog_id,
        'service_id' => Service::factory()->create(['service_name' => 'Wellness Exam'])->service_id,
        'appointment_date' => $date,
        'appointment_time' => '10:00:00',
        'status_id' => AppointmentStatus::firstOrCreate(['status_name' => $statusName])->status_id,
    ]);
}

/** A gateway that accepts every message. */
function fakeAcceptedGateway(): void
{
    Http::fake([
        'sms.test/*' => Http::response(['id' => 'msg-1', 'state' => 'Pending'], 200),
    ]);
}

test('approving a request texts the owner', function () {
    configureSmsGateway();
    fakeAcceptedGateway();
    $visit = smsBookVisit('Requested', today()->addDays(2)->toDateString());

    $this->actingAs(Staff::factory()->admin()->create())
        ->patch(route('admin.operations.appointments.confirm', $visit))
        ->assertSessionHasNoErrors();

    Http::assertSent(fn ($request) => $request->url() === 'https://sms.test/api/3rdparty/v1/message'
        && $request->hasHeader('Authorization', 'Basic '.base64_encode('gateway-user:gateway-secret'))
        && $request['phoneNumbers'] === ['+639171234567']
        && str_contains($request['message'], 'confirmed'));

    $notice = smsNoticeFor($visit);

    expect($notice)->not->toBeNull()
        ->and($notice->channel)->toBe('SMS')
        ->and($notice->status)->toBe('Sent')
        ->and($notice->sent_at)->not->toBeNull();
});

test('declining a request texts the owner it could not be accepted', function () {
    configureSmsGateway();
    fakeAcceptedGateway();
    $visit = smsBookVisit('Requested', today()->addDays(2)->toDateString());

    $this->actingAs(Staff::factory()->admin()->create())
        ->patch(route('admin.operations.appointments.cancel', $visit))
        ->assertSessionHasNoErrors();

    Http::assertSent(fn ($request) => str_contains($request['message'], 'could not be accepted'));

    expect(smsNoticeFor($visit)?->channel)->toBe('SMS');
});

test('approving still reaches the portal when the gateway is unconfigured', function () {
    // Enabled but with no credentials to send with.
    config([
        'services.sms_gateway.enabled' => true,
        'services.sms_gateway.username' => null,
        'services.sms_gateway.password' => null,
    ]);
    Http::fake();
    $visit = smsBookVisit('Requested', today()->addDays(2)->toDateString());

    $this->actingAs(Staff::factory()->admin()->create())
        ->patch(route('admin.operations.appointments.confirm', $visit))
        ->assertSessionHasNoErrors();

    Http::assertNothingSent();

    $notice = smsNoticeFor($visit);

    expect($notice)->not->toBeNull()
        ->and($notice->channel)->toBe('Push')
        ->and($notice->status)->toBe('Sent');
});

test('an unreadable phone number does not break the approval', function () {
    configureSmsGateway();
    Http::fake();
    $visit = smsBookVisit('Requested', today()->addDays(2)->toDateString(), phone: '123');

    $this->actingAs(Staff::factory()->admin()->create())
        ->patch(route('admin.operations.appointments.confirm', $visit))
        ->assertSessionHasNoErrors();

    Http::assertNothingSent();

    $notice = smsNoticeFor($visit);

    expect($notice)->not->toBeNull()
        ->and($notice->channel)->toBe('SMS')
        ->and($notice->status)->toBe('Failed');
});

test('a gateway failure is recorded but does not break the approval', function () {
    configureSmsGateway();
    Http::fake(['sms.test/*' => Http::response('gateway down', 500)]);

    $visit = smsBookVisit('Requested', today()->addDays(2)->toDateString());

    $this->actingAs(Staff::factory()->admin()->create())
        ->patch(route('admin.operations.appointments.confirm', $visit))
        ->assertSessionHasNoErrors();

    $notice = smsNoticeFor($visit);

    expect($notice)->not->toBeNull()
        ->and($notice->status)->toBe('Failed')
        ->and($notice->sent_at)->toBeNull();
});

test('the reminder command texts owners about tomorrow', function () {
    configureSmsGateway();
    fakeAcceptedGateway();
    $visit = smsBookVisit('Confirmed', today()->addDay()->toDateString());

    $this->artisan('appointments:send-reminders')->assertSuccessful();

    Http::assertSent(fn ($request) => $request['phoneNumbers'] === ['+639171234567']
        && str_contains($request['message'], 'Reminder:')
        && str_contains($request['message'], 'Wellness Exam'));

    $notice = smsNoticeFor($visit);

    expect($notice)->not->toBeNull()
        ->and($notice->channel)->toBe('SMS')
        ->and($notice->status)->toBe('Sent');
});

test('the reminder command ignores visits that are not tomorrow', function () {
    configureSmsGateway();
    Http::fake();
    smsBookVisit('Confirmed', today()->toDateString());
    smsBookVisit('Confirmed', today()->addDays(2)->toDateString());

    $this->artisan('appointments:send-reminders')->assertSuccessful();

    Http::assertNothingSent();
});

test('the reminder command skips visits that are no longer scheduled', function () {
    configureSmsGateway();
    Http::fake();
    smsBookVisit('Cancelled', today()->addDay()->toDateString());

    $this->artisan('appointments:send-reminders')->assertSuccessful();

    Http::assertNothingSent();
});

test('the reminder command does not text requests that were never approved', function () {
    configureSmsGateway();
    Http::fake();
    smsBookVisit('Requested', today()->addDay()->toDateString());

    $this->artisan('appointments:send-reminders')->assertSuccessful();

    Http::assertNothingSent();
});

test('running the reminder command twice does not text the owner twice', function () {
    configureSmsGateway();
    fakeAcceptedGateway();
    smsBookVisit('Confirmed', today()->addDay()->toDateString());

    $this->artisan('appointments:send-reminders')->assertSuccessful();
    $this->artisan('appointments:send-reminders')->assertSuccessful();

    Http::assertSentCount(1);
});
