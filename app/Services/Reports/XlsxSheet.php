<?php

namespace App\Services\Reports;

use RuntimeException;

/**
 * One sheet of a spreadsheet, built row by row.
 *
 * A cell is either a plain value — which takes the row's default style — or
 * `['value' => …, 'style' => …]` for a cell that needs to read differently from
 * its neighbours, such as the money column beside a list of labels. Money and
 * dates are written as real numbers with a number format, so a total in the
 * file can be summed by Excel itself rather than being text that looks like a
 * number.
 */
final class XlsxSheet
{
    /** The cell styles the writer's style sheet defines. */
    public const STYLES = [
        'default',
        'title',
        'subtitle',
        'label',
        'header',
        'money',
        'money_bold',
        'int',
        'date',
        'percent',
        'muted',
    ];

    /** @var list<list<array{value: mixed, style: string}>> */
    private array $rows = [];

    /** The 1-based row the first table header landed on: where the sheet freezes. */
    private int $firstHeaderRow = 0;

    /** The 1-based row the last table header landed on, for the filter range. */
    private int $lastHeaderRow = 0;

    /** How many tables the sheet holds. */
    private int $tables = 0;

    /**
     * @param  list<int|float>  $widths  Column widths, first column first.
     */
    public function __construct(public readonly string $name, private readonly array $widths = []) {}

    /**
     * A row of cells.
     *
     * @param  list<mixed>  $cells
     */
    public function row(array $cells, string $style = 'default'): self
    {
        $this->rows[] = array_map(
            fn (mixed $cell): array => self::cell($cell, $style),
            $cells,
        );

        return $this;
    }

    /** A heading row: one large bold label in the first column. */
    public function title(mixed $text): self
    {
        return $this->row([['value' => $text, 'style' => 'title']]);
    }

    /** A line of context under a title. */
    public function subtitle(mixed $text): self
    {
        return $this->row([['value' => $text, 'style' => 'subtitle']]);
    }

    /** An empty row, for spacing sections apart. */
    public function blank(int $count = 1): self
    {
        for ($row = 0; $row < $count; $row++) {
            $this->rows[] = [];
        }

        return $this;
    }

    /**
     * A table header. The sheet's first one is the row the sheet freezes, so a
     * long export can be scrolled like a table rather than read like a page,
     * and a sheet holding a single table also gets the filter dropdowns over
     * it. A sheet holding several tables — the summary, which is read top to
     * bottom — gets no filter, because Excel allows one per sheet and a filter
     * on half of it would say the wrong thing about the other half.
     *
     * @param  list<mixed>  $cells
     */
    public function header(array $cells): self
    {
        $this->row(array_map(fn (mixed $cell): array => ['value' => $cell, 'style' => 'header'], $cells));

        $this->tables++;
        $this->lastHeaderRow = count($this->rows);
        $this->firstHeaderRow = $this->firstHeaderRow === 0 ? $this->lastHeaderRow : $this->firstHeaderRow;

        return $this;
    }

    /**
     * A sheet as the workbook needs it: the columns, the frozen rows, the
     * filter range, and the cells themselves.
     */
    public function xml(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            .$this->sheetView()
            .$this->columns()
            .'<sheetData>'.$this->rowsXml().'</sheetData>'
            .$this->filter()
            .'</worksheet>';
    }

    private function sheetView(): string
    {
        if ($this->firstHeaderRow === 0) {
            return '<sheetViews><sheetView workbookViewId="0"/></sheetViews>';
        }

        $top = $this->firstHeaderRow + 1;

        return '<sheetViews><sheetView workbookViewId="0"><pane ySplit="'.$this->firstHeaderRow
            .'" topLeftCell="A'.$top.'" activePane="bottomLeft" state="frozen"/>'
            .'</sheetView></sheetViews>';
    }

    private function columns(): string
    {
        if ($this->widths === []) {
            return '';
        }

        $columns = '';

        foreach ($this->widths as $index => $width) {
            $position = $index + 1;
            $columns .= '<col min="'.$position.'" max="'.$position.'" width="'.$width.'" customWidth="1"/>';
        }

        return '<cols>'.$columns.'</cols>';
    }

    /**
     * The filter range, covering the sheet's only table and the data under it.
     * A sheet with no table, with several, or with nothing under its header
     * gets no filter: a dropdown over an empty table is just clutter.
     */
    private function filter(): string
    {
        if ($this->tables !== 1 || count($this->rows) <= $this->lastHeaderRow) {
            return '';
        }

        $columns = $this->rows[$this->lastHeaderRow - 1];

        if ($columns === []) {
            return '';
        }

        $last = self::columnName(count($columns));

        return '<autoFilter ref="A'.$this->lastHeaderRow.':'.$last.count($this->rows).'"/>';
    }

    private function rowsXml(): string
    {
        $xml = '';

        foreach ($this->rows as $index => $cells) {
            if ($cells === []) {
                continue;
            }

            $number = $index + 1;
            $xml .= '<row r="'.$number.'">';

            foreach ($cells as $column => $cell) {
                $reference = self::columnName($column + 1).$number;
                $style = array_search($cell['style'], self::STYLES, true);
                $attributes = ' r="'.$reference.'" s="'.($style === false ? 0 : $style).'"';

                // A date is written as the day number Excel counts from, with
                // a date format on the cell, so it sorts and filters as a date.
                if ($cell['style'] === 'date') {
                    $xml .= '<c'.$attributes.'><v>'.self::dateSerial((string) $cell['value']).'</v></c>';

                    continue;
                }

                if (is_int($cell['value']) || is_float($cell['value'])) {
                    $xml .= '<c'.$attributes.'><v>'.$cell['value'].'</v></c>';

                    continue;
                }

                $xml .= '<c'.$attributes.' t="inlineStr"><is><t xml:space="preserve">'
                    .self::escape((string) $cell['value']).'</t></is></c>';
            }

            $xml .= '</row>';
        }

        return $xml;
    }

    /**
     * Normalise whatever the caller passed into a value and a style.
     *
     * @return array{value: mixed, style: string}
     */
    private static function cell(mixed $cell, string $style): array
    {
        if (! is_array($cell)) {
            return ['value' => $cell, 'style' => $style];
        }

        /** @var array{value?: mixed, style?: string} $cell */
        $resolved = $cell['style'] ?? $style;

        if (! in_array($resolved, self::STYLES, true)) {
            throw new RuntimeException("Unknown spreadsheet cell style [{$resolved}].");
        }

        return ['value' => $cell['value'] ?? '', 'style' => $resolved];
    }

    /** `A` for 1, `Z` for 26, `AA` for 27. */
    public static function columnName(int $index): string
    {
        $name = '';

        while ($index > 0) {
            $index--;
            $name = chr(65 + ($index % 26)).$name;
            $index = intdiv($index, 26);
        }

        return $name;
    }

    /**
     * A `YYYY-MM-DD` day as Excel's serial number: 1900-01-01 is 1, and the
     * epoch Excel actually counts from is 1899-12-30.
     */
    public static function dateSerial(string $date): int
    {
        // Counted forwards from the epoch, so the serial grows with the date.
        $difference = (new \DateTimeImmutable('1899-12-30'))->diff(new \DateTimeImmutable($date));
        $days = (int) $difference->days;

        return $difference->invert === 1 ? -$days : $days;
    }

    /**
     * Text that is safe inside an XML text node: characters XML has no way to
     * carry are dropped rather than left to break the file.
     */
    private static function escape(string $value): string
    {
        $clean = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', '', $value) ?? '';

        return htmlspecialchars($clean, ENT_QUOTES | ENT_XML1);
    }
}
