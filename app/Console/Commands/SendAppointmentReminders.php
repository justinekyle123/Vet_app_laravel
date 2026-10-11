<?php

namespace App\Console\Commands;

use App\Services\Sms\AppointmentReminders;
use Illuminate\Console\Command;

/**
 * Sends the day-before SMS reminder for tomorrow's appointments. Scheduled to
 * run each morning; see routes/console.php.
 */
class SendAppointmentReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'appointments:send-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Text owners whose appointments are scheduled for tomorrow';

    /**
     * Execute the console command.
     */
    public function handle(AppointmentReminders $reminders): int
    {
        $sent = $reminders->send();

        $this->info("Sent {$sent} appointment reminder(s).");

        return self::SUCCESS;
    }
}
