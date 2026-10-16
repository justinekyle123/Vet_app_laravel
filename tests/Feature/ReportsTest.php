<?php

use App\Models\Appointment;
use App\Models\AppointmentStatus;
use App\Models\ClinicInfo;
use App\Models\Dog;
use App\Models\DogOwner;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\RatingFeedback;
use App\Models\Service;
use App\Models\Staff;
use App\Services\Reports\ClinicReport;
use App\Services\Reports\ReportRange;
use Carbon\CarbonImmutable;
use Inertia\Testing\AssertableInertia as Assert;

/*
|--------------------------------------------------------------------------
| Reports and analytics
|--------------------------------------------------------------------------
|
| Every test pins "now" so a window means the same thing on every run: the
| clinic is closed on Sundays and opens 08:00-18:00 unless a test says
| otherwise, and 2026-10-15 is a Thursday.
|
*/

beforeEach(function () {
    $this->travelTo(CarbonImmutable::parse('2026-10-15 10:00:00'));
    ClinicInfo::factory()->create();
});

/** A visit on the books, in the given state. */
function reportVisit(
    DogOwner $owner,
    string $date,
    string $status = 'Completed',
    string $time = '09:00',
    ?Service $service = null,
    ?Staff $provider = null,
): Appointment {
    $service ??= Service::factory()->create(['service_name' => 'Wellness Exam', 'price' => '100.00', 'duration_minutes' => 30]);

    return Appointment::create([
        'owner_id' => $owner->owner_id,
        'dog_id' => Dog::factory()->create(['owner_id' => $owner->owner_id])->dog_id,
        'service_id' => $service->service_id,
        'staff_id' => $provider?->staff_id,
        'appointment_date' => $date,
        'appointment_time' => $time,
        'status_id' => AppointmentStatus::firstOrCreate(['status_name' => $status])->status_id,
    ]);
}

/** A payment recorded against a visit, received on the given day. */
function reportPayment(
    Appointment $visit,
    string $amount,
    string $status = 'Paid',
    string $channel = 'GCash',
    string $paidOn = '2026-10-15',
): Payment {
    return Payment::create([
        'appointment_id' => $visit->appointment_id,
        'owner_id' => $visit->owner_id,
        'method_id' => PaymentMethod::firstOrCreate(['method_name' => $channel])->method_id,
        'amount' => $amount,
        'payment_status' => $status,
        'reference' => 'REF-'.$amount,
        'paid_at' => $paidOn.' 09:30:00',
    ]);
}

/**
 * A review left on a visit. The day it was left is forced in afterwards,
 * because `created_at` is not fillable and a mass-assigned one would be
 * silently dropped — leaving every review dated today.
 */
function reportRating(Appointment $visit, int $rating, string $leftOn): void
{
    $feedback = RatingFeedback::create([
        'appointment_id' => $visit->appointment_id,
        'owner_id' => $visit->owner_id,
        'rating' => $rating,
    ]);

    $feedback->forceFill(['created_at' => $leftOn.' 12:00:00'])->save();
}

/** The report figures for a window, as the page receives them. */
function reportFigures(string $from, string $to): array
{
    return app(ClinicReport::class)->build(ReportRange::fromRequest(request()->merge([
        'from' => $from,
        'to' => $to,
    ])));
}

test('an admin sees the report page for the requested window', function () {
    $owner = DogOwner::factory()->create();

    reportVisit($owner, '2026-10-14');
    reportVisit($owner, '2026-10-13');
    // Outside the window on both sides: neither may be counted.
    reportVisit($owner, '2026-10-01');
    reportVisit($owner, '2026-10-20');

    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('admin.reports.index', ['from' => '2026-10-12', 'to' => '2026-10-16']))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Reports')
            ->where('figures.range.from', '2026-10-12')
            ->where('figures.range.to', '2026-10-16')
            ->where('figures.range.days', 5)
            ->where('figures.appointments.total', 2)
            // One row per day of the window, including the quiet ones.
            ->has('figures.appointments.by_day', 5)
            ->where('figures.appointments.by_day.0.date', '2026-10-12')
            ->where('figures.appointments.by_day.4.date', '2026-10-16')
            ->has('presets', count(ReportRange::PRESETS))
            ->etc()
        );
});

test('the report breaks visits down by status and rates what reached an end', function () {
    $owner = DogOwner::factory()->create();

    reportVisit($owner, '2026-10-14', 'Completed');
    reportVisit($owner, '2026-10-14', 'Completed');
    reportVisit($owner, '2026-10-14', 'Cancelled');
    reportVisit($owner, '2026-10-15', 'No-show');
    // Still awaiting a decision, so it is left out of the completion rate.
    reportVisit($owner, '2026-10-16', 'Requested');

    $figures = reportFigures('2026-10-12', '2026-10-16');

    expect($figures['appointments']['total'])->toBe(5)
        ->and($figures['appointments']['completed'])->toBe(2)
        ->and($figures['appointments']['cancelled'])->toBe(1)
        ->and($figures['appointments']['no_show'])->toBe(1)
        ->and($figures['appointments']['requested'])->toBe(1)
        // Two of the four decided visits were carried out.
        ->and($figures['appointments']['completed_rate'])->toBe(50.0)
        // Two of every five bookings were lost.
        ->and($figures['appointments']['cancellation_rate'])->toBe(40.0)
        ->and($figures['appointments']['by_status'][0])->toBe(['status' => 'Requested', 'count' => 1, 'share' => 20.0])
        ->and($figures['appointments']['by_status'][2])->toBe(['status' => 'Completed', 'count' => 2, 'share' => 40.0]);
});

test('the busiest hours are the clinic hours, and quiet hours are still listed', function () {
    $owner = DogOwner::factory()->create();

    reportVisit($owner, '2026-10-14', 'Confirmed', '08:30');
    reportVisit($owner, '2026-10-14', 'Confirmed', '08:45');
    reportVisit($owner, '2026-10-14', 'Confirmed', '14:00');

    $hours = collect(reportFigures('2026-10-14', '2026-10-14')['appointments']['by_hour']);

    // The clinic opens at 08:00 and closes at 18:00, so the axis runs 8 AM to
    // 5 PM — an hour the clinic can start a visit in — and every hour between
    // is listed even when nothing was booked.
    expect($hours->pluck('label')->first())->toBe('8 AM')
        ->and($hours->pluck('label')->last())->toBe('5 PM')
        ->and($hours)->toHaveCount(10)
        ->and($hours->firstWhere('label', '8 AM')['count'])->toBe(2)
        ->and($hours->firstWhere('label', '2 PM')['count'])->toBe(1)
        ->and($hours->firstWhere('label', '12 PM')['count'])->toBe(0);
});

test('money is counted on the day it was received, not the day of the visit', function () {
    $owner = DogOwner::factory()->create();

    $inWindow = reportVisit($owner, '2026-10-14', 'Completed', '09:00', Service::factory()->create(['price' => '200.00']));
    $paidAhead = reportVisit($owner, '2026-10-30', 'Confirmed', '09:00', Service::factory()->create(['price' => '120.00']));
    $unpaid = reportVisit($owner, '2026-10-14', 'Completed', '11:00', Service::factory()->create(['price' => '80.00']));

    // A deposit for a visit still to come, taken inside the window: it is this
    // window's money even though the visit is not.
    reportPayment($paidAhead, '60.00', 'Paid', 'GCash');
    // The visit in the window, settled at the desk.
    reportPayment($inWindow, '200.00', 'Paid', 'Card');
    // Taken back when the clinic called a visit off.
    reportPayment($inWindow, '30.00', 'Refunded', 'Maya');
    // Received before the window opened: last period's money.
    reportPayment($inWindow, '40.00', 'Paid', 'GCash', '2026-10-05');

    $figures = reportFigures('2026-10-12', '2026-10-16');
    $revenue = $figures['revenue'];

    expect($revenue['taken'])->toBe('260.00')
        ->and($revenue['taken_count'])->toBe(2)
        ->and($revenue['refunded'])->toBe('30.00')
        ->and($revenue['refunded_count'])->toBe(1)
        ->and($revenue['net'])->toBe('230.00')
        // The 80.00 visit in the window was never settled, so it is still owed.
        ->and($revenue['outstanding'])->toBe('80.00')
        ->and($revenue['outstanding_visits'])->toBe(1)
        // The two completed visits in the window are worth 280.00 of work.
        ->and($revenue['billed'])->toBe('280.00')
        ->and($revenue['completed_visits'])->toBe(2);

    $channels = collect($revenue['by_channel']);

    // Every channel the clinic offers is listed, so a month without one reads
    // as zero rather than as a missing row.
    expect($channels->pluck('channel'))->toContain('GCash', 'Maya', 'Card', 'Bank Transfer')
        ->and($channels->firstWhere('channel', 'GCash')['taken'])->toBe('60.00')
        ->and($channels->firstWhere('channel', 'GCash')['refunded'])->toBe('0.00')
        ->and($channels->firstWhere('channel', 'Card')['taken'])->toBe('200.00')
        ->and($channels->firstWhere('channel', 'Maya')['taken'])->toBe('0.00')
        ->and($channels->firstWhere('channel', 'Maya')['refunded'])->toBe('30.00')
        ->and($channels->firstWhere('channel', 'Bank Transfer')['count'])->toBe(0);
});

test('services are reported by what they earned, most first', function () {
    $owner = DogOwner::factory()->create();
    $grooming = Service::factory()->create(['service_name' => 'Grooming', 'price' => '150.00']);
    $exam = Service::factory()->create(['service_name' => 'Wellness Exam', 'price' => '50.00']);

    reportVisit($owner, '2026-10-14', 'Completed', '09:00', $grooming);
    reportVisit($owner, '2026-10-14', 'Completed', '10:00', $grooming);
    reportVisit($owner, '2026-10-15', 'Completed', '09:00', $exam);
    reportVisit($owner, '2026-10-15', 'Cancelled', '10:00', $exam);

    $services = collect(reportFigures('2026-10-12', '2026-10-16')['services']);

    expect($services->pluck('service')->all())->toBe(['Grooming', 'Wellness Exam'])
        ->and($services->firstWhere('service', 'Grooming'))
        ->toMatchArray(['bookings' => 2, 'completed' => 2, 'lost' => 0, 'revenue' => '300.00'])
        ->and($services->firstWhere('service', 'Wellness Exam'))
        ->toMatchArray(['bookings' => 2, 'completed' => 1, 'lost' => 1, 'revenue' => '50.00']);
});

test('clients are split into first visits and people coming back', function () {
    $returning = DogOwner::factory()->create();
    $fresh = DogOwner::factory()->create();

    // The clinic saw this client a fortnight before the window.
    reportVisit($returning, '2026-09-28');
    reportVisit($returning, '2026-10-14');
    reportVisit($fresh, '2026-10-15');

    DogOwner::factory()->create(); // Registered but never booked.

    $figures = reportFigures('2026-10-12', '2026-10-16');

    expect($figures['clients']['served'])->toBe(2)
        ->and($figures['clients']['returning'])->toBe(1)
        ->and($figures['clients']['first_visit'])->toBe(1)
        // Two accounts were created inside the window (the factory's clock is
        // "now"), and one of them came in.
        ->and($figures['clients']['new_owners'])->toBe(3)
        ->and($figures['clients']['total_owners'])->toBe(3);
});

test('every headline figure is compared with the window before it', function () {
    $owner = DogOwner::factory()->create();

    reportVisit($owner, '2026-10-14'); // this window
    reportVisit($owner, '2026-10-08'); // the five days before it
    reportVisit($owner, '2026-10-09');

    $figures = reportFigures('2026-10-12', '2026-10-16');

    expect($figures['headline']['appointments'])->toBe(1)
        ->and($figures['headline']['completed'])->toBe(1)
        ->and($figures['previous']['appointments'])->toBe(2)
        ->and($figures['previous']['completed'])->toBe(2)
        ->and($figures['range']['days'])->toBe(5);
});

test('the ratings are averaged and spread over the window', function () {
    $owner = DogOwner::factory()->create();
    $first = reportVisit($owner, '2026-10-14');
    $second = reportVisit($owner, '2026-10-15');

    reportRating($first, 5, '2026-10-14');
    reportRating($second, 4, '2026-10-15');
    // Outside the window: it must not move the average.
    reportRating(reportVisit($owner, '2026-09-01'), 1, '2026-09-01');

    $ratings = reportFigures('2026-10-12', '2026-10-16')['ratings'];

    expect($ratings['average'])->toBe(4.5)
        ->and($ratings['count'])->toBe(2)
        ->and(collect($ratings['distribution'])->firstWhere('stars', 5)['count'])->toBe(1)
        ->and(collect($ratings['distribution'])->firstWhere('stars', 1)['count'])->toBe(0);
});

test('the window presets cover today, the last week, and this month', function () {
    $this->actingAs(Staff::factory()->admin()->create());

    $this->get(route('admin.reports.index', ['preset' => 'today']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('figures.range.from', '2026-10-15')
            ->where('figures.range.to', '2026-10-15')
            ->where('figures.range.days', 1)
        );

    $this->get(route('admin.reports.index', ['preset' => 'last_7']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('figures.range.from', '2026-10-09')
            ->where('figures.range.days', 7)
        );

    $this->get(route('admin.reports.index', ['preset' => 'this_month']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('figures.range.from', '2026-10-01')
            ->where('figures.range.to', '2026-10-15')
        );

    $this->get(route('admin.reports.index', ['preset' => 'last_month']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('figures.range.from', '2026-09-01')
            ->where('figures.range.to', '2026-09-30')
        );
});

test('a window typed backwards is read the right way round', function () {
    $owner = DogOwner::factory()->create();
    reportVisit($owner, '2026-10-14');

    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('admin.reports.index', ['from' => '2026-10-16', 'to' => '2026-10-12']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('figures.range.from', '2026-10-12')
            ->where('figures.range.to', '2026-10-16')
            ->where('figures.appointments.total', 1)
        );
});

test('the PDF is a real, complete PDF named after the window', function () {
    $owner = DogOwner::factory()->create();
    $visit = reportVisit($owner, '2026-10-14', 'Completed', '09:00', Service::factory()->create(['price' => '250.00']));
    reportPayment($visit, '250.00');

    $response = $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('admin.reports.pdf', ['from' => '2026-10-12', 'to' => '2026-10-16']));

    $response->assertOk();

    $body = $response->getContent();

    expect($response->headers->get('Content-Type'))->toContain('application/pdf')
        ->and($response->headers->get('Content-Disposition'))
        ->toContain('attachment; filename="myvet-animal-clinic-report-2026-10-12-to-2026-10-16.pdf"')
        ->and($body)->toStartWith('%PDF-')
        ->and($body)->toContain('/Type /Catalog')
        ->and(rtrim($body))->toEndWith('%%EOF');
});

test('the PDF view carries the report figures themselves', function () {
    $owner = DogOwner::factory()->create();
    $visit = reportVisit($owner, '2026-10-14', 'Completed', '09:00', Service::factory()->create(['service_name' => 'Dental Cleaning', 'price' => '250.00']));
    reportPayment($visit, '250.00', 'Paid', 'Card');

    $figures = reportFigures('2026-10-12', '2026-10-16');

    $this->view('reports.clinic', ['report' => $figures, 'clinic' => 'MyVet Animal Clinic'])
        ->assertSee('MyVet Animal Clinic')
        ->assertSee('Clinic report for')
        ->assertSee('Oct 12 – Oct 16, 2026')
        ->assertSee('Visits booked')
        ->assertSee('Money taken')
        ->assertSee('$250.00')
        ->assertSee('Dental Cleaning')
        ->assertSee('Card')
        ->assertSee('Still owed on these visits');
});

test('the spreadsheet is a real xlsx workbook of the report', function () {
    $owner = DogOwner::factory()->create();
    $visit = reportVisit($owner, '2026-10-14', 'Completed', '09:00', Service::factory()->create(['service_name' => 'Dental Cleaning', 'price' => '250.00']));
    reportPayment($visit, '250.00', 'Paid', 'Card');
    // Named so the sheet has to carry it rather than a placeholder.
    $visit->owner->update(['first_name' => 'Ana', 'last_name' => 'Reyes']);

    $response = $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('admin.reports.excel', ['from' => '2026-10-12', 'to' => '2026-10-16']));

    $response->assertOk();

    expect($response->headers->get('Content-Type'))
        ->toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        ->and($response->headers->get('Content-Disposition'))
        ->toContain('attachment; filename="myvet-animal-clinic-report-2026-10-12-to-2026-10-16.xlsx"')
        ->and($response->getContent())->toStartWith('PK');

    $workbook = reportWorkbook($response->getContent());

    // The five sheets, in the order the clinic reads them.
    expect($workbook->sheetNames())->toBe(['Summary', 'Visits', 'Payments', 'Services', 'Clients']);

    $summary = $workbook->sheet('Summary');

    expect($summary)
        ->toContain('Clinic report — Oct 12 – Oct 16, 2026')
        ->toContain('Money taken')
        // Money is written as a number with a money format, not as text.
        ->toContain('<v>250</v>')
        // The status table, and the running total under it.
        ->toContain('Completed')
        // It freezes at the first table, so the title stays put while the
        // report is scrolled...
        ->toContain('<pane ySplit="4"')
        // ...and it carries no filter, because Excel allows one filter per
        // sheet and this one holds several tables.
        ->not->toContain('<autoFilter');

    expect($workbook->styles())
        ->toContain('formatCode="#,##0.00"')
        ->toContain('formatCode="yyyy\-mm\-dd"')
        ->toContain('<fgColor rgb="FF1A3D1A"/>');

    // The detail sheets carry the rows behind the totals, with the client's
    // name and the channel the money came through — and a single table, so
    // they get the filter dropdowns as well as the frozen header.
    expect($workbook->sheet('Visits'))
        ->toContain('Ana Reyes')
        ->toContain('Dental Cleaning')
        // A date the spreadsheet can sort on: 2026-10-14 as Excel's day number.
        ->toContain('<v>46309</v>')
        ->toContain('<pane ySplit="4"')
        ->toContain('<autoFilter ref="A4:K5"/>');

    expect($workbook->sheet('Payments'))
        ->toContain('Ana Reyes')
        ->toContain('Card')
        ->toContain('REF-250.00');

    expect($workbook->sheet('Services'))->toContain('Dental Cleaning')
        ->and($workbook->sheet('Clients'))->toContain('First visit');
});

test('the spreadsheet holds only the visits inside the asked-for window', function () {
    $owner = DogOwner::factory()->create();
    reportVisit($owner, '2026-10-14', 'Completed', '09:00', Service::factory()->create(['service_name' => 'Inside Window']));
    reportVisit($owner, '2026-09-02', 'Completed', '09:00', Service::factory()->create(['service_name' => 'Outside Window']));

    $response = $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('admin.reports.excel', ['from' => '2026-10-12', 'to' => '2026-10-16']));

    $response->assertOk();

    expect(reportWorkbook($response->getContent())->sheet('Visits'))
        ->toContain('Inside Window')
        ->not->toContain('Outside Window');
});

test('an empty window exports cleanly instead of failing', function () {
    $admin = Staff::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.reports.excel'))
        ->assertOk();

    $this->actingAs($admin)
        ->get(route('admin.reports.pdf'))
        ->assertOk();

    $this->actingAs($admin)
        ->get(route('admin.reports.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('figures.appointments.total', 0)
            ->where('figures.revenue.taken', '0.00')
            ->where('figures.ratings.average', null)
            ->has('figures.services', 0)
        );
});

test('only an admin can read or export the clinic report', function () {
    $manager = Staff::factory()->admin()->create();
    $veterinarian = Staff::factory()->veterinarian()->create();
    $owner = DogOwner::factory()->create();

    foreach (['admin.reports.index', 'admin.reports.pdf', 'admin.reports.excel'] as $route) {
        $this->actingAs($veterinarian)->get(route($route))->assertForbidden();
        $this->actingAs($owner)->get(route($route))->assertForbidden();

        $this->actingAs($manager)->get(route($route))->assertOk();
    }
});

/**
 * A tiny reader for the workbook the export returned: enough to prove the file
 * is a workbook of sheets rather than a blob, and to read the parts back.
 */
function reportWorkbook(string $bytes): object
{
    $path = tempnam(sys_get_temp_dir(), 'report').'.xlsx';
    file_put_contents($path, $bytes);

    $zip = new ZipArchive;
    expect($zip->open($path))->toBeTrue();

    return new class($zip, $path)
    {
        public function __construct(private ZipArchive $zip, private string $path) {}

        /** @return list<string> */
        public function sheetNames(): array
        {
            preg_match_all('/<sheet name="([^"]+)"/', (string) $this->zip->getFromName('xl/workbook.xml'), $matches);

            return $matches[1];
        }

        /** The XML of one sheet, by the name on its tab. */
        public function sheet(string $name): string
        {
            $index = array_search($name, $this->sheetNames(), true);

            return (string) $this->zip->getFromName('xl/worksheets/sheet'.($index + 1).'.xml');
        }

        public function styles(): string
        {
            return (string) $this->zip->getFromName('xl/styles.xml');
        }

        public function __destruct()
        {
            $this->zip->close();
            @unlink($this->path);
        }
    };
}
