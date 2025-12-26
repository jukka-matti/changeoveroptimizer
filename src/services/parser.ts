import ExcelJS from 'exceljs';
import { ParsedFile } from '@/types';

export interface ParseOptions {
  /** Which sheet to parse (default: first) */
  sheet?: string;
  /** Max rows to parse (default: unlimited) */
  maxRows?: number;
  /** Skip empty rows (default: true) */
  skipEmpty?: boolean;
}

export type ParseError =
  | { code: 'UNSUPPORTED_FORMAT'; message: string }
  | { code: 'EMPTY_FILE'; message: string }
  | { code: 'CORRUPTED'; message: string }
  | { code: 'TOO_LARGE'; message: string }
  | { code: 'NO_HEADERS'; message: string }
  | { code: 'ENCODING'; message: string };

export type ParseResult =
  | { ok: true; data: ParsedFile }
  | { ok: false; error: ParseError };

const SUPPORTED_EXTENSIONS = ['xlsx', 'xls', 'csv', 'tsv'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

/**
 * Parse a file from an ArrayBuffer (Excel or CSV).
 */
export async function parseFile(
  buffer: ArrayBuffer,
  filename: string,
  options: ParseOptions = {}
): Promise<ParseResult> {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';

  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_FORMAT',
        message: `Unsupported file type: .${ext}. Please use Excel (.xlsx, .xls) or CSV files.`,
      },
    };
  }

  if (buffer.byteLength > MAX_FILE_SIZE) {
    return {
      ok: false,
      error: {
        code: 'TOO_LARGE',
        message: `File is too large (${Math.round(buffer.byteLength / 1024 / 1024)} MB). Maximum size is 50 MB.`,
      },
    };
  }

  try {
    const workbook = new ExcelJS.Workbook();

    // Load based on file type
    if (ext === 'csv' || ext === 'tsv') {
      // For CSV/TSV, parse manually since exceljs csv.read needs Node streams
      const text = new TextDecoder().decode(buffer);
      const delimiter = ext === 'tsv' ? '\t' : ',';
      const csvRows = parseCSVText(text, delimiter);

      if (csvRows.length > 0) {
        const sheet = workbook.addWorksheet('Sheet1');
        csvRows.forEach((row) => {
          sheet.addRow(row);
        });
      }
    } else {
      await workbook.xlsx.load(buffer);
    }

    const sheets = workbook.worksheets.map(ws => ws.name);

    if (sheets.length === 0) {
      return {
        ok: false,
        error: { code: 'EMPTY_FILE', message: 'File contains no sheets.' },
      };
    }

    const activeSheetName = options.sheet ?? sheets[0];
    const worksheet = workbook.worksheets.find(ws => ws.name === activeSheetName);

    if (!worksheet) {
      return {
        ok: false,
        error: { code: 'EMPTY_FILE', message: `Sheet "${activeSheetName}" not found.` },
      };
    }

    // Extract data - first row is headers
    const rows: Record<string, unknown>[] = [];
    let columns: string[] = [];
    let isFirstRow = true;

    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const values = row.values as (string | number | Date | null | undefined)[];
      // ExcelJS row.values is 1-indexed (index 0 is undefined)
      const cellValues = values.slice(1);

      if (isFirstRow) {
        // First row = headers
        columns = cellValues.map((v, i) => {
          if (v === null || v === undefined || v === '') {
            return `Column ${i + 1}`;
          }
          return String(v).trim();
        });
        isFirstRow = false;
      } else {
        // Data rows
        const rowData: Record<string, unknown> = {};
        columns.forEach((col, i) => {
          const value = cellValues[i];
          rowData[col] = formatCellValue(value);
        });
        rows.push(rowData);
      }
    });

    // Filter empty rows if needed
    const filteredRows = options.skipEmpty !== false
      ? rows.filter(row => Object.values(row).some(v => v !== ''))
      : rows;

    if (filteredRows.length === 0) {
      return {
        ok: false,
        error: { code: 'EMPTY_FILE', message: 'File contains no data rows.' },
      };
    }

    if (columns.length === 0) {
      return {
        ok: false,
        error: { code: 'NO_HEADERS', message: 'Could not detect column headers.' },
      };
    }

    const limitedRows = options.maxRows
      ? filteredRows.slice(0, options.maxRows)
      : filteredRows;

    return {
      ok: true,
      data: {
        name: filename,
        path: '', // Set by caller
        sheets,
        activeSheet: activeSheetName,
        rows: limitedRows,
        columns,
        rowCount: filteredRows.length,
      },
    };
  } catch (e) {
    console.error('Parse error:', e);
    return {
      ok: false,
      error: {
        code: 'CORRUPTED',
        message: 'Could not read file. It may be corrupted or password-protected.',
      },
    };
  }
}

/**
 * Parse CSV/TSV text into rows of string arrays.
 * Handles quoted fields and escaped quotes.
 */
function parseCSVText(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    if (line.trim() === '') continue;

    const row: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (inQuotes) {
        if (char === '"') {
          if (line[i + 1] === '"') {
            // Escaped quote
            current += '"';
            i++;
          } else {
            // End of quoted field
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === delimiter) {
          row.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
    }
    row.push(current.trim());
    rows.push(row);
  }

  return rows;
}

/**
 * Format cell value to string for consistent output.
 */
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Date) {
    return value.toISOString().split('T')[0]; // YYYY-MM-DD
  }
  if (typeof value === 'object' && 'text' in value) {
    // Rich text
    return String((value as { text: string }).text);
  }
  if (typeof value === 'object' && 'result' in value) {
    // Formula result
    return String((value as { result: unknown }).result ?? '');
  }
  return String(value);
}

/**
 * Detect likely Order ID column using heuristics.
 */
export function detectOrderIdColumn(columns: string[]): string | null {
  const patterns = [
    /^order[_\s-]?id$/i,
    /^order[_\s-]?no$/i,
    /^order[_\s-]?number$/i,
    /^order$/i,
    /^id$/i,
    /^po[_\s-]?number$/i,
    /^job[_\s-]?id$/i,
    /^job[_\s-]?no$/i,
    /^work[_\s-]?order$/i,
    /^wo[_\s-]?number$/i,
  ];

  for (const pattern of patterns) {
    const match = columns.find(col => pattern.test(col));
    if (match) return match;
  }

  return columns[0] ?? null;
}

/**
 * Detect likely attribute columns (exclude Order ID).
 */
export function detectAttributeColumns(
  columns: string[],
  orderIdColumn: string | null
): string[] {
  const exclude = [
    orderIdColumn?.toLowerCase(),
    'id',
    'date',
    'created',
    'modified',
    'quantity',
    'qty',
    'amount',
    'price',
    'notes',
    'comments',
    'description',
  ].filter(Boolean) as string[];

  return columns.filter(col =>
    !exclude.includes(col.toLowerCase())
  );
}
