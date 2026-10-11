<?php

namespace App\Services\Sms;

use App\Models\Appointment;
use App\Models\Notification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * The day-before text: owners whose visit is confirmed for tomorrow get one
 * reminder through the Android SMS Gateway.
 *
 * Only confirmed visits are reminded — a request still waiting on the desk is
 * not something to tell the owner to turn up for.
 *
 * Each attempt is written to the clinic's `notifications` log with the SMS
 * channel, so the owner sees it in the portal bell and the desk can see what
 * went out. The command is safe to run more than once a day: an appointment
 * that already has a sent reminder is skipped rather than texted twice.
 */
class AppointmentReminders
{
    /** The only status a visit is reminded from: it has been approved. */
    private const REMINDABLE_STATUS = 'Confirmed';

    public function __construct(private SmsGateway $sms) {}

    /**
     * Text every owner with an appointment on the given day's morrow.
     *
     * Returns how many reminders the gateway accepted.
     */
    public function send(?Carbon $day = null): int
    {
        if (! $this->sms->isConfigured()) {
            Log::warning('Appointment reminders skipped: the Android SMS Gateway credentials are not configured.');

            return 0;
        }

        $target = ($day ?? today())->copy()->addDay();

        $appointments = Appointment::query()
            ->with(['owner:owner_id,first_name,last_name,phone_number', 'dog:dog_id,dog_name', 'service:service_id,service_name'])
            ->whereDate('appointment_date', $target->toDateString())
            ->whereHas('status', fn ($status) => $status->where('status_name', self::REMINDABLE_STATUS))
            ->get();

        $sent = 0;

        foreach ($appointments as $appointment) {
            if ($this->alreadyReminded($appointment)) {
                continue;
            }

            $message = $this->message($appointment);
            $delivered = $this->sms->send($appointment->owner?->phone_number, $message);

            Notification::create([
                'owner_id' => $appointment->owner_id,
                'appointment_id' => $appointment->appointment_id,
                'channel' => 'SMS',
                'message' => $message,
                'status' => $delivered ? 'Sent' : 'Failed',
                'sent_at' => $delivered ? now() : null,
            ]);

            if ($delivered) {
                $sent++;
            }
        }

        return $sent;
    }

    /**
     * Whether a reminder text has already gone out for this visit.
     */
    private function alreadyReminded(Appointment $appointment): bool
    {
        return Notification::query()
            ->where('appointment_id', $appointment->appointment_id)
            ->where('channel', 'SMS')
            ->where('status', 'Sent')
            ->where('message', 'like', 'Reminder:%')
            ->exists();
    }

    /** The reminder sentence, kept short enough for one text. */
    private function message(Appointment $appointment): string
    {
        $dog = $appointment->dog?->dog_name ?? 'your dog';
        $service = $appointment->service?->service_name ?? 'appointment';
        $date = $appointment->appointment_date?->format('M j, Y') ?? 'tomorrow';
        $time = substr((string) $appointment->appointment_time, 0, 5) ?: 'the scheduled time';

        return sprintf(
            'Reminder: %s has a %s appointment tomorrow, %s at %s. See you at the clinic!',
            $dog,
            $service,
            $date,
            $time,
        );
    }
}
