<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ClinicInfo;
use App\Services\Reports\ClinicReport;
use App\Services\Reports\ClinicReportWorkbook;
use App\Services\Reports\ReportRange;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Reports and analytics: the clinic's own figures for any window, on screen and
 * as a file the clinic can keep.
 *
 * All three entry points — the page, the PDF, and the spreadsheet — read the
 * window from the same query string and build their numbers through
 * {@see ClinicReport}, so what the administrator sees is exactly what the
 * download contains. That is the whole reason the window lives in the URL
 * rather than in the page's state.
 *
 * The page shows the figures for the requested window *and* the window before
 * it, so a number always has a direction. Exports carry the window in their
 * filename, which is what makes an archived report identifiable months later.
 */
class ReportController extends Controller
{
    /** What each window in the picker is called. */
    private const PRESET_LABELS = [
        'today' => 'Today',
        'last_7' => 'Last 7 days',
        'last_30' => 'Last 30 days',
        'this_month' => 'This month',
        'last_month' => 'Last month',
        'this_year' => 'This year',
        'custom' => 'Custom',
    ];

    public function index(Request $request, ClinicReport $report): Response
    {
        $range = ReportRange::fromRequest($request);

        return Inertia::render('Admin/Reports', [
            'figures' => $report->build($range),
            'presets' => collect(ReportRange::PRESETS)
                ->map(fn (string $preset): array => [
                    'value' => $preset,
                    'label' => self::PRESET_LABELS[$preset] ?? Str::headline($preset),
                ])
                ->all(),
            'clinic' => ClinicInfo::current()->clinic_name,
        ]);
    }

    /**
     * The report as a printable PDF, ready to hand to a client or file away.
     */
    public function pdf(Request $request, ClinicReport $report): HttpResponse
    {
        $range = ReportRange::fromRequest($request);
        $clinic = ClinicInfo::current()->clinic_name;

        $document = Pdf::loadView('reports.clinic', [
            'report' => $report->build($range),
            'clinic' => $clinic,
        ])
            ->setPaper('a4')
            ->output();

        return $this->download($document, $this->filename($clinic, $range, 'pdf'), 'application/pdf');
    }

    /**
     * The report as a spreadsheet: the summary first, then the visits and
     * payments behind it, as rows the clinic can sort and total itself.
     */
    public function excel(Request $request, ClinicReportWorkbook $workbook): HttpResponse
    {
        $range = ReportRange::fromRequest($request);
        $clinic = ClinicInfo::current()->clinic_name;

        $bytes = $workbook->contents($range, $clinic);

        return $this->download(
            $bytes,
            $this->filename($clinic, $range, 'xlsx'),
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
    }

    /** A file the browser saves rather than renders, built in memory. */
    private function download(string $contents, string $filename, string $contentType): HttpResponse
    {
        return response($contents, 200, [
            'Content-Type' => $contentType,
            'Content-Length' => (string) strlen($contents),
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Cache-Control' => 'no-store, max-age=0',
        ]);
    }

    /**
     * `myvet-animal-clinic-report-2026-09-01-to-2026-10-17.pdf` — the window is
     * in the name because that is the one thing an archived copy has to say.
     */
    private function filename(string $clinic, ReportRange $range, string $extension): string
    {
        $slug = Str::slug($clinic) ?: 'clinic';

        return "{$slug}-report-{$range->from->toDateString()}-to-{$range->to->toDateString()}.{$extension}";
    }
}
