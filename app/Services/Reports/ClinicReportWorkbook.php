<?php

namespace App\Services\Reports;

/**
 * The clinic report as a spreadsheet.
 *
 * Five sheets, in the order the clinic works through them: the summary it
 * reads first, then the two detail sheets behind every figure (the visits and
 * the payments), then how the work divided across services and across clients.
 *
 * The summary carries the report's own figures; the detail sheets carry the
 * rows behind them, as real typed cells — dates as dates, money as numbers with
 * a two-decimal format — so the clinic can sort, filter, and re-add them the
 * moment the file opens.
 */
final class ClinicReportWorkbook
{
    public function __construct(private readonly ClinicReport $report) {}

    /** The finished workbook, as bytes. */
    public function contents(ReportRange $range, string $clinicName): string
    {
        $figures = $this->report->build($range);

        $writer = new XlsxWriter($clinicName);

        $this->summary($writer->sheet('Summary', [42, 18, 18]), $figures);
        $this->visits($writer->sheet('Visits', [12, 8, 24, 16, 26, 20, 12, 12, 12, 12, 12]), $range);
        $this->payments($writer->sheet('Payments', [12, 12, 24, 16, 26, 16, 12, 12, 20]), $range);
        $this->services($writer->sheet('Services', [30, 12, 12, 10, 14, 10]), $figures);
        $this->clients($writer->sheet('Clients', [34, 14, 16]), $figures);

        return $writer->contents();
    }

    /**
     * @param  array<string, mixed>  $figures
     */
    private function summary(XlsxSheet $sheet, array $figures): void
    {
        $appointments = $figures['appointments'];
        $revenue = $figures['revenue'];
        $range = $figures['range'];

        $sheet->title("Clinic report — {$range['label']}")
            ->subtitle("Generated {$figures['generated_at']} · {$range['days']} days")
            ->blank();

        $sheet->header(['Figures', 'This period', 'Previous period']);
        $sheet->row(['Visits booked', $appointments['total'], $figures['previous']['appointments']]);
        $sheet->row(['Visits completed', $appointments['completed'], $figures['previous']['completed']]);
        $sheet->row([
            ['value' => 'Completion rate', 'style' => 'label'],
            ['value' => $appointments['completed_rate'] / 100, 'style' => 'percent'],
            ['value' => '', 'style' => 'default'],
        ]);
        $sheet->row([
            ['value' => 'Money taken', 'style' => 'label'],
            ['value' => (float) $revenue['taken'], 'style' => 'money'],
            ['value' => (float) $figures['previous']['received'], 'style' => 'money'],
        ]);
        $sheet->row([['value' => 'Refunded', 'style' => 'default'], ['value' => (float) $revenue['refunded'], 'style' => 'money']]);
        $sheet->row([['value' => 'Net taken', 'style' => 'label'], ['value' => (float) $revenue['net'], 'style' => 'money_bold']]);
        $sheet->row([['value' => 'Value of work completed', 'style' => 'default'], ['value' => (float) $revenue['billed'], 'style' => 'money']]);
        $sheet->row([['value' => 'Still owed on these visits', 'style' => 'default'], ['value' => (float) $revenue['outstanding'], 'style' => 'money']]);
        $sheet->row(['New clients', $figures['clients']['new_owners'], $figures['previous']['new_owners']]);
        $sheet->row([
            ['value' => 'Average rating', 'style' => 'default'],
            ['value' => $figures['ratings']['average'] ?? '—', 'style' => 'default'],
            ['value' => $figures['previous']['average_rating'] ?? '—', 'style' => 'default'],
        ]);

        $sheet->blank(2);
        $sheet->header(['Visits by status', 'Count', 'Share']);
        foreach ($appointments['by_status'] as $row) {
            $sheet->row([
                $row['status'],
                $row['count'],
                ['value' => $row['share'] / 100, 'style' => 'percent'],
            ]);
        }
        $sheet->row([
            ['value' => 'Total', 'style' => 'label'],
            ['value' => $appointments['total'], 'style' => 'int'],
            ['value' => 1, 'style' => 'percent'],
        ]);

        $sheet->blank(2);
        $sheet->header(['Money by channel', 'Taken', 'Refunded', 'Payments']);
        foreach ($revenue['by_channel'] as $row) {
            $sheet->row([
                $row['channel'],
                ['value' => (float) $row['taken'], 'style' => 'money'],
                ['value' => (float) $row['refunded'], 'style' => 'money'],
                ['value' => $row['count'], 'style' => 'int'],
            ]);
        }
    }

    private function visits(XlsxSheet $sheet, ReportRange $range): void
    {
        $rows = $this->report->visitRows($range);

        $sheet->title("Visits — {$range->label()}")
            ->subtitle(count($rows).' visits in this period')
            ->blank();
        $sheet->header(['Date', 'Time', 'Client', 'Dog', 'Service', 'Provider', 'Status', 'Price', 'Paid', 'Balance', 'Refunded']);

        foreach ($rows as $row) {
            $sheet->row([
                ['value' => $row['date'], 'style' => 'date'],
                $row['time'],
                $row['client'],
                $row['dog'],
                $row['service'],
                $row['provider'],
                $row['status'],
                ['value' => $row['price'], 'style' => 'money'],
                ['value' => $row['paid'], 'style' => 'money'],
                ['value' => $row['balance'], 'style' => 'money'],
                ['value' => $row['refunded'], 'style' => 'money'],
            ]);
        }

        if ($rows === []) {
            $sheet->row([['value' => 'No visits in this period.', 'style' => 'muted']]);
        }
    }

    private function payments(XlsxSheet $sheet, ReportRange $range): void
    {
        $rows = $this->report->paymentRows($range);

        $sheet->title("Payments received — {$range->label()}")
            ->subtitle(count($rows).' payments in this period')
            ->blank();
        $sheet->header(['Paid on', 'Visit on', 'Client', 'Dog', 'Service', 'Channel', 'Amount', 'Status', 'Reference']);

        foreach ($rows as $row) {
            $sheet->row([
                ['value' => $row['paid_on'], 'style' => 'date'],
                ['value' => $row['visit_on'], 'style' => 'date'],
                $row['client'],
                $row['dog'],
                $row['service'],
                $row['channel'],
                ['value' => $row['amount'], 'style' => 'money'],
                $row['status'],
                $row['reference'],
            ]);
        }

        if ($rows === []) {
            $sheet->row([['value' => 'No payments in this period.', 'style' => 'muted']]);
        }
    }

    /**
     * @param  array<string, mixed>  $figures
     */
    private function services(XlsxSheet $sheet, array $figures): void
    {
        $sheet->title('Services — '.$figures['range']['label'])->blank();
        $sheet->header(['Service', 'Bookings', 'Completed', 'Missed', 'Revenue', 'Share of revenue']);

        foreach ($figures['services'] as $row) {
            $sheet->row([
                $row['service'],
                ['value' => $row['bookings'], 'style' => 'int'],
                ['value' => $row['completed'], 'style' => 'int'],
                ['value' => $row['lost'], 'style' => 'int'],
                ['value' => (float) $row['revenue'], 'style' => 'money'],
                ['value' => $row['share'] / 100, 'style' => 'percent'],
            ]);
        }

        if ($figures['services'] === []) {
            $sheet->row([['value' => 'No services were booked in this period.', 'style' => 'muted']]);
        }

        $sheet->blank(2);
        $sheet->header(['Care team', 'Visits', 'Completed']);
        foreach ($figures['staff'] as $row) {
            $sheet->row([
                $row['staff'],
                ['value' => $row['visits'], 'style' => 'int'],
                ['value' => $row['completed'], 'style' => 'int'],
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $figures
     */
    private function clients(XlsxSheet $sheet, array $figures): void
    {
        $clients = $figures['clients'];
        $allTime = $figures['all_time'];

        $sheet->title('Clients — '.$figures['range']['label'])->blank();
        $sheet->header(['Clients seen', 'Count', 'Detail']);
        $sheet->row(['Clients seen', $clients['served'], 'in this period']);
        $sheet->row(['First visit', $clients['first_visit'], 'never seen before this period']);
        $sheet->row(['Returning', $clients['returning'], 'seen before this period']);
        $sheet->row(['New registrations', $clients['new_owners'], 'portal accounts created']);
        $sheet->row(['Dogs registered', $clients['new_dogs'], 'added to the register']);

        $sheet->blank(2);
        $sheet->header(['Top clients by spend', 'Visits', 'Spend']);
        foreach ($clients['top_spenders'] as $row) {
            $sheet->row([
                $row['owner'],
                ['value' => $row['visits'], 'style' => 'int'],
                ['value' => (float) $row['spend'], 'style' => 'money'],
            ]);
        }

        $sheet->blank(2);
        $sheet->header(['Clinic records', 'Count', 'Detail']);
        $sheet->row(['Accounts', $allTime['accounts']['total'], $allTime['accounts']['admins'].' admin · '.$allTime['accounts']['owners'].' dog owners']);
        $sheet->row(['Dog owners', $clients['total_owners'], $clients['active_owners'].' active']);
        $sheet->row(['Dogs on file', $clients['total_dogs'], $clients['active_dogs'].' active']);
    }
}
