@php
    /**
     * The clinic report as a printed page.
     *
     * Dompdf renders this without a browser, so the styling is deliberately
     * plain: no flexbox or grid, no web fonts, and a single system font stack.
     * Everything is a table, which is both what a report is and what the PDF
     * engine lays out reliably.
     *
     * @var array<string, mixed> $report
     * @var string $clinic
     */
    $money = fn (string|float|int $value): string => '$'.number_format((float) $value, 2);
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $clinic }} — clinic report {{ $report['range']['label'] }}</title>
    <style>
        @page { margin: 34px 38px 46px; }
        body { font-family: DejaVu Sans, Helvetica, Arial, sans-serif; color: #1a3d1a; font-size: 10px; line-height: 1.45; }
        h1 { font-size: 19px; margin: 0 0 2px; }
        h2 { font-size: 12px; margin: 22px 0 6px; padding-bottom: 4px; border-bottom: 1px solid #cfe0cf; text-transform: uppercase; letter-spacing: 0.6px; }
        p { margin: 0; }
        .muted { color: #5f6f5f; }
        .range { font-size: 11px; margin-top: 3px; }
        table { width: 100%; border-collapse: collapse; margin-top: 4px; }
        th { background: #1a3d1a; color: #ffffff; text-align: left; padding: 5px 6px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.4px; }
        td { padding: 5px 6px; border-bottom: 1px solid #e4ece4; }
        tr.total td { font-weight: bold; background: #EFFDF0; border-bottom: none; }
        td.number, th.number { text-align: right; }
        .cards { width: 100%; border-collapse: separate; border-spacing: 6px 0; margin-top: 4px; }
        .cards td { width: 25%; background: #EFFDF0; border: 1px solid #dbeadb; padding: 7px 8px; vertical-align: top; }
        .cards .label { font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; color: #5f6f5f; }
        .cards .value { font-size: 15px; font-weight: bold; }
        .delta { font-size: 8px; color: #5f6f5f; }
        .footer { margin-top: 26px; padding-top: 8px; border-top: 1px solid #cfe0cf; font-size: 8px; color: #5f6f5f; }
    </style>
</head>
<body>
    <h1>{{ $clinic }}</h1>
    <p class="range">
        Clinic report for <strong>{{ $report['range']['label'] }}</strong>
        ({{ $report['range']['days'] }} {{ Str::plural('day', $report['range']['days']) }})
    </p>
    <p class="muted">Generated {{ $report['generated_at'] }} · compared with the {{ $report['range']['days'] }} days before it</p>

    @php
        $headline = $report['headline'];
        $previous = $report['previous'];
        $change = function (float|int $now, float|int $before) {
            if ((float) $before === 0.0) {
                return (float) $now === 0.0 ? 'no change' : 'new in this period';
            }
            $percent = round((($now - $before) / $before) * 100, 1);
            return ($percent > 0 ? '+' : '').$percent.'% vs previous period';
        };
    @endphp

    <h2>Headline figures</h2>
    <table class="cards">
        <tr>
            <td>
                <div class="label">Visits booked</div>
                <div class="value">{{ number_format($headline['appointments']) }}</div>
                <div class="delta">{{ $change($headline['appointments'], $previous['appointments']) }}</div>
            </td>
            <td>
                <div class="label">Visits completed</div>
                <div class="value">{{ number_format($headline['completed']) }}</div>
                <div class="delta">{{ $change($headline['completed'], $previous['completed']) }}</div>
            </td>
            <td>
                <div class="label">Money taken</div>
                <div class="value">{{ $money($headline['received']) }}</div>
                <div class="delta">{{ $change((float) $headline['received'], (float) $previous['received']) }}</div>
            </td>
            <td>
                <div class="label">New clients</div>
                <div class="value">{{ number_format($headline['new_owners']) }}</div>
                <div class="delta">{{ $change($headline['new_owners'], $previous['new_owners']) }}</div>
            </td>
        </tr>
    </table>

    <h2>Visits</h2>
    <table>
        <tr>
            <th>Status</th>
            <th class="number">Visits</th>
            <th class="number">Share</th>
        </tr>
        @foreach ($report['appointments']['by_status'] as $row)
            <tr>
                <td>{{ $row['status'] }}</td>
                <td class="number">{{ number_format($row['count']) }}</td>
                <td class="number">{{ $row['share'] }}%</td>
            </tr>
        @endforeach
        <tr class="total">
            <td>Total</td>
            <td class="number">{{ number_format($report['appointments']['total']) }}</td>
            <td class="number">100%</td>
        </tr>
    </table>
    <p class="muted">
        {{ $report['appointments']['completed_rate'] }}% of the visits that reached an end were carried out;
        {{ $report['appointments']['cancellation_rate'] }}% of all bookings were called off or missed.
    </p>

    <h2>Money</h2>
    <table>
        <tr>
            <th>Channel</th>
            <th class="number">Taken</th>
            <th class="number">Refunded</th>
            <th class="number">Payments</th>
        </tr>
        @foreach ($report['revenue']['by_channel'] as $row)
            <tr>
                <td>{{ $row['channel'] }}</td>
                <td class="number">{{ $money($row['taken']) }}</td>
                <td class="number">{{ $money($row['refunded']) }}</td>
                <td class="number">{{ number_format($row['count']) }}</td>
            </tr>
        @endforeach
        <tr class="total">
            <td>Total</td>
            <td class="number">{{ $money($report['revenue']['taken']) }}</td>
            <td class="number">{{ $money($report['revenue']['refunded']) }}</td>
            <td class="number">{{ number_format($report['revenue']['taken_count']) }}</td>
        </tr>
    </table>

    <table style="margin-top: 8px;">
        <tr>
            <td>Net taken in the period</td>
            <td class="number"><strong>{{ $money($report['revenue']['net']) }}</strong></td>
            <td>Value of work completed</td>
            <td class="number">{{ $money($report['revenue']['billed']) }} across {{ number_format($report['revenue']['completed_visits']) }} visits</td>
        </tr>
        <tr>
            <td>Still owed on these visits</td>
            <td class="number"><strong>{{ $money($report['revenue']['outstanding']) }}</strong></td>
            <td>Average visit</td>
            <td class="number">{{ $money($report['revenue']['average_visit']) }}</td>
        </tr>
    </table>

    <h2>Services</h2>
    <table>
        <tr>
            <th>Service</th>
            <th class="number">Bookings</th>
            <th class="number">Completed</th>
            <th class="number">Missed</th>
            <th class="number">Revenue</th>
        </tr>
        @forelse ($report['services'] as $row)
            <tr>
                <td>{{ $row['service'] }}</td>
                <td class="number">{{ number_format($row['bookings']) }}</td>
                <td class="number">{{ number_format($row['completed']) }}</td>
                <td class="number">{{ number_format($row['lost']) }}</td>
                <td class="number">{{ $money($row['revenue']) }}</td>
            </tr>
        @empty
            <tr><td colspan="5" class="muted">No services were booked in this period.</td></tr>
        @endforelse
    </table>

    <h2>Clients</h2>
    <table>
        <tr>
            <th>Clients seen</th>
            <th class="number">First visit</th>
            <th class="number">Returning</th>
            <th class="number">New registrations</th>
            <th class="number">Dogs registered</th>
            <th class="number">Average rating</th>
        </tr>
        <tr>
            <td>{{ number_format($report['clients']['served']) }}</td>
            <td class="number">{{ number_format($report['clients']['first_visit']) }}</td>
            <td class="number">{{ number_format($report['clients']['returning']) }}</td>
            <td class="number">{{ number_format($report['clients']['new_owners']) }}</td>
            <td class="number">{{ number_format($report['clients']['new_dogs']) }}</td>
            <td class="number">{{ $report['ratings']['average'] ?? '—' }}{{ $report['ratings']['count'] > 0 ? ' ('.$report['ratings']['count'].')' : '' }}</td>
        </tr>
    </table>

    @if ($report['clients']['top_spenders'] !== [])
        <table style="margin-top: 8px;">
            <tr>
                <th>Top clients in this period</th>
                <th class="number">Visits</th>
                <th class="number">Spend</th>
            </tr>
            @foreach ($report['clients']['top_spenders'] as $row)
                <tr>
                    <td>{{ $row['owner'] }}</td>
                    <td class="number">{{ number_format($row['visits']) }}</td>
                    <td class="number">{{ $money($row['spend']) }}</td>
                </tr>
            @endforeach
        </table>
    @endif

    <div class="footer">
        Prepared from live clinic records — visits are counted on the day of the visit, money on the day it
        was received. Ongoing records: {{ number_format($report['all_time']['accounts']['owners']) }} dog owners,
        {{ number_format($report['all_time']['accounts']['total']) }} accounts, and
        {{ number_format($report['clients']['total_dogs']) }} dogs on file.
    </div>
</body>
</html>
