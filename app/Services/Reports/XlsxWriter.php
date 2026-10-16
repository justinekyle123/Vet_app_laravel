<?php

namespace App\Services\Reports;

use RuntimeException;
use ZipArchive;

/**
 * A minimal, dependency-free `.xlsx` writer.
 *
 * A spreadsheet file is a ZIP of XML parts, so this assembles the handful of
 * parts Excel insists on — the content types, the workbook, the styles, and one
 * sheet per table — and hands back the bytes. Nothing here needs a spreadsheet
 * library, an extension beyond the ZIP support PHP already ships with, or a
 * writable directory: the file is built in memory and returned.
 *
 * The style sheet is fixed and small, which is why the styles are a plain
 * ordered list: {@see XlsxSheet::STYLES} names them in the same order the
 * `cellXfs` entries are written in, so a style's name is its index in the file.
 * Adding a style means adding it at the end of both, never in the middle.
 *
 * The writer is deliberately not a general-purpose spreadsheet engine: it
 * writes the clinic's reports, and it writes them as real tables — typed cells,
 * number formats, frozen header rows, and a filter over each one — so the file
 * opens as something to work with rather than as a picture of a page.
 */
final class XlsxWriter
{
    /** @var list<XlsxSheet> */
    private array $sheets = [];

    public function __construct(private readonly string $creator = 'MyVet Animal Clinic') {}

    /**
     * Start a sheet. The name is what Excel shows on the tab; the widths are in
     * Excel's own units, first column first.
     *
     * @param  list<int|float>  $widths
     */
    public function sheet(string $name, array $widths = []): XlsxSheet
    {
        $sheet = new XlsxSheet($this->sheetName($name), $widths);
        $this->sheets[] = $sheet;

        return $sheet;
    }

    /** How many sheets the workbook has. */
    public function sheetCount(): int
    {
        return count($this->sheets);
    }

    /** Write the workbook to disk and say how many bytes it came to. */
    public function save(string $path): int
    {
        $written = file_put_contents($path, $this->contents());

        if ($written === false) {
            throw new RuntimeException("Could not write the spreadsheet to [{$path}].");
        }

        return $written;
    }

    /**
     * The workbook as bytes, ready to send to a browser.
     */
    public function contents(): string
    {
        if ($this->sheets === []) {
            throw new RuntimeException('A workbook needs at least one sheet.');
        }

        $temporary = tempnam(sys_get_temp_dir(), 'xlsx');

        if ($temporary === false) {
            throw new RuntimeException('Could not create a temporary file for the workbook.');
        }

        $zip = new ZipArchive;

        if ($zip->open($temporary, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new RuntimeException('Could not open the workbook archive for writing.');
        }

        $zip->addFromString('[Content_Types].xml', $this->contentTypes());
        $zip->addFromString('_rels/.rels', $this->rootRelations());
        $zip->addFromString('docProps/core.xml', $this->coreProperties());
        $zip->addFromString('xl/workbook.xml', $this->workbook());
        $zip->addFromString('xl/_rels/workbook.xml.rels', $this->workbookRelations());
        $zip->addFromString('xl/styles.xml', $this->styles());

        foreach ($this->sheets as $index => $sheet) {
            $zip->addFromString('xl/worksheets/sheet'.($index + 1).'.xml', $sheet->xml());
        }

        $zip->close();

        $bytes = file_get_contents($temporary);
        @unlink($temporary);

        if ($bytes === false) {
            throw new RuntimeException('Could not read back the finished workbook.');
        }

        return $bytes;
    }

    private function contentTypes(): string
    {
        $overrides = '';

        foreach ($this->sheets as $index => $sheet) {
            $overrides .= '<Override PartName="/xl/worksheets/sheet'.($index + 1).'.xml" '
                .'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
        }

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            .'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            .'<Default Extension="xml" ContentType="application/xml"/>'
            .'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            .'<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
            .'<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
            .$overrides
            .'</Types>';
    }

    private function rootRelations(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            .'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
            .'</Relationships>';
    }

    private function coreProperties(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
            .'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" '
            .'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
            .'<dc:creator>'.self::escape($this->creator).'</dc:creator>'
            .'<cp:lastModifiedBy>'.self::escape($this->creator).'</cp:lastModifiedBy>'
            .'<dcterms:created xsi:type="dcterms:W3CDTF">'.now()->toIso8601String().'</dcterms:created>'
            .'</cp:coreProperties>';
    }

    private function workbook(): string
    {
        $sheets = '';

        foreach ($this->sheets as $index => $sheet) {
            $sheets .= '<sheet name="'.self::escape($sheet->name).'" sheetId="'.($index + 1)
                .'" r:id="rId'.($index + 1).'"/>';
        }

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
            .'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            .'<sheets>'.$sheets.'</sheets>'
            .'</workbook>';
    }

    private function workbookRelations(): string
    {
        $relations = '';

        foreach ($this->sheets as $index => $sheet) {
            $relations .= '<Relationship Id="rId'.($index + 1).'" '
                .'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" '
                .'Target="worksheets/sheet'.($index + 1).'.xml"/>';
        }

        $styles = count($this->sheets) + 1;

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .$relations
            .'<Relationship Id="rId'.$styles.'" '
            .'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
            .'</Relationships>';
    }

    /**
     * The style sheet, in the same order as {@see XlsxSheet::STYLES}: default,
     * title, subtitle, label, header, money, money bold, whole number, date,
     * percentage, muted.
     */
    private function styles(): string
    {
        $numberFormats = '<numFmts count="4">'
            .'<numFmt numFmtId="164" formatCode="#,##0.00"/>'
            .'<numFmt numFmtId="165" formatCode="yyyy\-mm\-dd"/>'
            .'<numFmt numFmtId="166" formatCode="#,##0"/>'
            .'<numFmt numFmtId="167" formatCode="0.0%"/>'
            .'</numFmts>';

        $fonts = '<fonts count="5">'
            .'<font><sz val="11"/><name val="Calibri"/></font>'
            .'<font><b/><sz val="11"/><name val="Calibri"/></font>'
            .'<font><b/><sz val="14"/><color rgb="FF1A3D1A"/><name val="Calibri"/></font>'
            .'<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>'
            .'<font><i/><sz val="11"/><color rgb="FF5F6F5F"/><name val="Calibri"/></font>'
            .'</fonts>';

        // Excel requires the first two fills to be none and gray125, in that
        // order, before any fill of the clinic's own.
        $fills = '<fills count="3">'
            .'<fill><patternFill patternType="none"/></fill>'
            .'<fill><patternFill patternType="gray125"/></fill>'
            .'<fill><patternFill patternType="solid"><fgColor rgb="FF1A3D1A"/><bgColor indexed="64"/></patternFill></fill>'
            .'</fills>';

        $borders = '<borders count="1">'
            .'<border><left/><right/><top/><bottom/><diagonal/></border>'
            .'</borders>';

        $cellFormats = '<cellXfs count="11">'
            .'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'                                              // default
            .'<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>'                                 // title
            .'<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/>'                                 // subtitle
            .'<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>'                                 // label
            .'<xf numFmtId="0" fontId="3" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>'                    // header
            .'<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'                       // money
            .'<xf numFmtId="164" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>'         // money bold
            .'<xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'                       // whole number
            .'<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'                       // date
            .'<xf numFmtId="167" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'                       // percentage
            .'<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/>'                                 // muted
            .'</cellXfs>';

        // The named "Normal" cell style is what tells a reader which format
        // unstyled cells fall back to; without it a reader has to invent one.
        $cellStyles = '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>';

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            .$numberFormats.$fonts.$fills.$borders
            .'<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
            .$cellFormats
            .$cellStyles
            .'</styleSheet>';
    }

    /**
     * A sheet name Excel will accept: no `[]:*?/\`, never blank, and never
     * longer than the 31 characters a tab allows.
     */
    private function sheetName(string $name): string
    {
        $clean = trim(str_replace(['[', ']', ':', '*', '?', '/', '\\'], '', $name));

        return mb_substr($clean === '' ? 'Sheet' : $clean, 0, 31);
    }

    private static function escape(string $value): string
    {
        $clean = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', '', $value) ?? '';

        return htmlspecialchars($clean, ENT_QUOTES | ENT_XML1);
    }
}
