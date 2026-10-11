<?php

namespace App\Services\Sms;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * The bridge to the Android phone that sends the clinic's texts.
 *
 * Messages go to the SMS Gateway for Android cloud API (capcom6), which
 * relays them over the gateway app's own SIM. The owner's number is
 * normalised to E.164 first, because the gateway only accepts that shape and
 * the clinic stores Philippine numbers with a leading zero.
 *
 * Delivery must never take the appointment flow down with it: a missing
 * credential, an unreadable number, or a gateway outage is logged and
 * reported as `false`, and the caller decides what to record.
 */
class SmsGateway
{
    /**
     * Send one text, returning whether the gateway accepted it.
     */
    public function send(?string $phoneNumber, string $message): bool
    {
        $number = $this->toE164($phoneNumber);

        if ($number === null) {
            Log::warning('SMS skipped: the owner has no valid Philippine mobile number.', [
                'phone_number' => $phoneNumber,
            ]);

            return false;
        }

        if (! $this->isConfigured()) {
            Log::warning('SMS skipped: the Android SMS Gateway credentials are not configured.');

            return false;
        }

        /** @var array{username: string, password: string, url: string} $config */
        $config = config('services.sms_gateway');

        try {
            $response = Http::withBasicAuth($config['username'], $config['password'])
                ->acceptJson()
                ->timeout(15)
                ->post($this->endpoint(), [
                    'message' => $message,
                    'phoneNumbers' => [$number],
                ]);
        } catch (Throwable $e) {
            Log::error('SMS could not reach the Android SMS Gateway.', [
                'exception' => $e->getMessage(),
            ]);

            return false;
        }

        if ($response->failed()) {
            Log::error('The Android SMS Gateway rejected the message.', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return false;
        }

        return true;
    }

    /**
     * Whether the gateway has been given the credentials it needs to send.
     */
    public function isConfigured(): bool
    {
        return (bool) config('services.sms_gateway.enabled')
            && filled(config('services.sms_gateway.username'))
            && filled(config('services.sms_gateway.password'));
    }

    /**
     * Convert a stored Philippine number to the E.164 shape the gateway wants,
     * or null when it is not a mobile number the clinic can text.
     *
     * Accepts `09171234567`, `9171234567`, `+639171234567`, and the same
     * values written with spaces, dashes, or parentheses.
     */
    public function toE164(?string $phoneNumber): ?string
    {
        if ($phoneNumber === null) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $phoneNumber) ?? '';

        if ($digits === '') {
            return null;
        }

        $countryCode = match (true) {
            str_starts_with($digits, '63') => $digits,
            str_starts_with($digits, '0') => '63'.substr($digits, 1),
            default => '63'.$digits,
        };

        return preg_match('/^639\d{9}$/', $countryCode) === 1
            ? '+'.$countryCode
            : null;
    }

    /**
     * The full message endpoint, joined so a trailing slash in configuration
     * cannot produce a doubled separator.
     */
    private function endpoint(): string
    {
        return rtrim((string) config('services.sms_gateway.url'), '/').'/message';
    }
}
