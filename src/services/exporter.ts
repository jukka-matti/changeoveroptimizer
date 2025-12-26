import ExcelJS from 'exceljs';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { OptimizationResult } from '@/types';

// Set up pdfMake fonts (with null check for browser-only mode)
if (typeof window !== 'undefined' && (pdfFonts as any)?.pdfMake?.vfs) {
  (pdfMake as any).vfs = (pdfFonts as any).pdfMake.vfs;
}

export type ExportFormat = 'xlsx' | 'csv' | 'clipboard' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  includeSummary: boolean;
  includeOriginal: boolean;
  filename?: string;
}

export interface ExportResult {
  data: Uint8Array | string;
  filename: string;
  mimeType: string;
}

/**
 * Generate export data based on format and options.
 */
export async function generateExport(
  result: OptimizationResult,
  sourceRows: Record<string, unknown>[],
  options: ExportOptions
): Promise<ExportResult> {
  switch (options.format) {
    case 'xlsx':
      return generateExcel(result, sourceRows, options);
    case 'csv':
      return generateCSV(result);
    case 'clipboard':
      return generateClipboard(result);
    case 'pdf':
      return generatePDF(result, options);
    default:
      throw new Error(`Unsupported format: ${options.format}`);
  }
}

async function generateExcel(
  result: OptimizationResult,
  sourceRows: Record<string, unknown>[],
  options: ExportOptions
): Promise<ExportResult> {
  const workbook = new ExcelJS.Workbook();

  // Sheet 1: Optimized Sequence
  const sequenceSheet = workbook.addWorksheet('Optimized Sequence');

  // Build headers
  const sampleOrder = result.sequence[0];
  const attrKeys = sampleOrder ? Object.keys(sampleOrder.values) : [];
  const headers = ['#', 'Order ID', ...attrKeys, 'Downtime (min)', 'Work Time (min)', 'Changed Attributes'];

  sequenceSheet.addRow(headers);

  // Style header row
  const headerRow = sequenceSheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF3F4F6' },
  };

  // Add data rows
  result.sequence.forEach((order) => {
    const row = [
      order.sequenceNumber,
      order.id,
      ...attrKeys.map(k => order.values[k]),
      order.downtime,
      order.workTime,
      order.changeoverReasons.join(', ') || '—',
    ];
    sequenceSheet.addRow(row);
  });

  // Auto-fit columns
  sequenceSheet.columns.forEach(column => {
    column.width = 15;
  });

  // Sheet 2: Summary
  if (options.includeSummary) {
    const summarySheet = workbook.addWorksheet('Optimization Summary');
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Orders', result.sequence.length],
      ['', ''],
      ['=== DOWNTIME (Production Impact) ===', ''],
      ['Original Downtime (min)', result.totalDowntimeBefore],
      ['Optimized Downtime (min)', result.totalDowntimeAfter],
      ['Downtime Savings (min)', result.downtimeSavings],
      ['Downtime Reduction (%)', `${result.downtimeSavingsPercent}%`],
      ['', ''],
      ['=== WORK TIME (Labor Cost) ===', ''],
      ['Original Work Time (min)', result.totalBefore],
      ['Optimized Work Time (min)', result.totalAfter],
      ['Work Time Savings (min)', result.savings],
      ['Work Time Reduction (%)', `${result.savingsPercent}%`],
      ['', ''],
      ['Attribute Breakdown:', ''],
      ...result.attributeStats.map(stat => [
        `  ${stat.column}${stat.parallelGroup !== 'default' ? ` (Group ${stat.parallelGroup})` : ''}`,
        `${stat.changeoverCount} changes, ${stat.totalTime} min`
      ])
    ];
    summaryData.forEach(row => summarySheet.addRow(row));

    // Style header
    const sHeaderRow = summarySheet.getRow(1);
    sHeaderRow.font = { bold: true };
  }

  // Sheet 3: Original Data
  if (options.includeOriginal && sourceRows.length > 0) {
    const originalSheet = workbook.addWorksheet('Original Schedule');
    const origHeaders = Object.keys(sourceRows[0]);
    originalSheet.addRow(origHeaders);

    const oHeaderRow = originalSheet.getRow(1);
    oHeaderRow.font = { bold: true };

    sourceRows.forEach(row => {
      originalSheet.addRow(origHeaders.map(h => row[h]));
    });
  }

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();

  return {
    data: new Uint8Array(buffer as ArrayBuffer),
    filename: options.filename || 'optimized-schedule.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}

function generateCSV(result: OptimizationResult): ExportResult {
  if (result.sequence.length === 0) {
    return {
      data: '',
      filename: 'optimized-schedule.csv',
      mimeType: 'text/csv',
    };
  }

  const firstOrder = result.sequence[0];
  const attrKeys = Object.keys(firstOrder.values);
  const headers = ['sequence', 'order_id', ...attrKeys, 'downtime_min', 'work_time_min', 'changed_attributes'];

  const rows = result.sequence.map(order => {
    const values = [
      order.sequenceNumber,
      order.id,
      ...attrKeys.map(k => order.values[k]),
      order.downtime,
      order.workTime,
      order.changeoverReasons.join('; '),
    ];
    return values.map(v => escapeCSV(String(v))).join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');

  return {
    data: csv,
    filename: 'optimized-schedule.csv',
    mimeType: 'text/csv',
  };
}

/**
 * Escape a value for CSV output.
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function generateClipboard(result: OptimizationResult): ExportResult {
  if (result.sequence.length === 0) return { data: '', filename: '', mimeType: '' };

  const firstOrder = result.sequence[0];
  const attrKeys = Object.keys(firstOrder.values);
  const headers = ['#', 'Order ID', ...attrKeys, 'Downtime (min)', 'Work Time (min)'];

  const rows = result.sequence.map(order => [
    order.sequenceNumber,
    order.id,
    ...attrKeys.map(k => order.values[k]),
    order.downtime,
    order.workTime
  ]);

  const text = [
    headers.join('\t'),
    ...rows.map(row => row.join('\t'))
  ].join('\n');

  return {
    data: text,
    filename: 'clipboard',
    mimeType: 'text/plain',
  };
}

async function generatePDF(
  result: OptimizationResult,
  options: ExportOptions
): Promise<ExportResult> {
  const firstOrder = result.sequence[0];
  const attrKeys = firstOrder ? Object.keys(firstOrder.values) : [];

  const docDefinition: any = {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [40, 60, 40, 60],
    header: {
      text: 'ChangeoverOptimizer - Optimized Production Schedule',
      style: 'header',
      margin: [40, 20, 0, 0]
    },
    footer: (currentPage: number, pageCount: number) => {
      return {
        columns: [
          { text: `Generated on ${new Date().toLocaleDateString()}`, margin: [40, 0] },
          { text: `Page ${currentPage} of ${pageCount}`, alignment: 'right', margin: [0, 0, 40, 0] }
        ],
        style: 'footer'
      };
    },
    content: [
      {
        text: 'Production Summary',
        style: 'subheader',
        margin: [0, 0, 0, 10]
      },
      {
        table: {
          widths: ['*', '*', '*', '*', '*'],
          body: [
            [
              { text: 'Orders', style: 'tableHeader' },
              { text: 'Original Downtime', style: 'tableHeader' },
              { text: 'Optimized Downtime', style: 'tableHeader' },
              { text: 'Downtime Saved', style: 'tableHeader' },
              { text: 'Work Time Saved', style: 'tableHeader' }
            ],
            [
              result.sequence.length,
              `${result.totalDowntimeBefore} min`,
              `${result.totalDowntimeAfter} min`,
              `${result.downtimeSavings} min (${result.downtimeSavingsPercent}%)`,
              `${result.savings} min (${result.savingsPercent}%)`
            ]
          ]
        },
        margin: [0, 0, 0, 20]
      },
      {
        text: 'Optimized Sequence',
        style: 'subheader',
        margin: [0, 0, 0, 10]
      },
      {
        table: {
          headerRows: 1,
          widths: ['auto', '*', ...attrKeys.map(() => '*'), 'auto', 'auto'],
          body: [
            [
              { text: '#', style: 'tableHeader' },
              { text: 'Order ID', style: 'tableHeader' },
              ...attrKeys.map(k => ({ text: k, style: 'tableHeader' })),
              { text: 'Downtime', style: 'tableHeader' },
              { text: 'Work', style: 'tableHeader' }
            ],
            ...result.sequence.map(order => [
              order.sequenceNumber,
              order.id,
              ...attrKeys.map(k => order.values[k]),
              order.downtime > 0 ? `+${order.downtime}m` : '—',
              order.workTime > 0 && order.workTime !== order.downtime
                ? `+${order.workTime}m`
                : '—'
            ])
          ]
        },
        layout: 'lightHorizontalLines'
      }
    ],
    styles: {
      header: {
        fontSize: 10,
        color: '#666666'
      },
      footer: {
        fontSize: 8,
        color: '#999999'
      },
      subheader: {
        fontSize: 16,
        bold: true,
        color: '#1a56db'
      },
      tableHeader: {
        bold: true,
        fontSize: 11,
        color: 'black',
        fillColor: '#f3f4f6'
      }
    },
    defaultStyle: {
      fontSize: 10
    }
  };

  return new Promise((resolve) => {
    const pdfDoc = pdfMake.createPdf(docDefinition);
    pdfDoc.getBuffer((buffer) => {
      resolve({
        data: new Uint8Array(buffer),
        filename: options.filename || 'optimized-schedule.pdf',
        mimeType: 'application/pdf',
      });
    });
  });
}
