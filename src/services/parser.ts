import * as XLSX from 'xlsx';
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
    const workbook = XLSX.read(buffer, {
      type: 'array',
      cellDates: true,
      cellNF: false,
      cellText: false,
    });

    const sheets = workbook.SheetNames;

    if (sheets.length === 0) {
      return {
        ok: false,
        error: { code: 'EMPTY_FILE', message: 'File contains no sheets.' },
      };
    }

    const activeSheet = options.sheet ?? sheets[0];
    const sheet = workbook.Sheets[activeSheet];

    if (!sheet) {
      return {
        ok: false,
        error: { code: 'EMPTY_FILE', message: `Sheet "${activeSheet}" not found.` },
      };
    }

    const rawRows = XLSX.utils.sheet_to_json(sheet, {
      defval: '',
      raw: false,
    }) as Record<string, unknown>[];

    const rows = options.skipEmpty !== false
      ? rawRows.filter(row => Object.values(row).some(v => v !== ''))
      : rawRows;

    if (rows.length === 0) {
      return {
        ok: false,
        error: { code: 'EMPTY_FILE', message: 'File contains no data rows.' },
      };
    }

    const columns = Object.keys(rows[0]);

    if (columns.length === 0) {
      return {
        ok: false,
        error: { code: 'NO_HEADERS', message: 'Could not detect column headers.' },
      };
    }

    const limitedRows = options.maxRows
      ? rows.slice(0, options.maxRows)
      : rows;

    return {
      ok: true,
      data: {
        name: filename,
        path: '', // Set by caller
        sheets,
        activeSheet,
        rows: limitedRows,
        columns,
        rowCount: rows.length,
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


