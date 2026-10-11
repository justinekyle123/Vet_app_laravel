<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Text owners whose appointments are scheduled for tomorrow, every morning.
Schedule::command('appointments:send-reminders')->dailyAt('08:00');
