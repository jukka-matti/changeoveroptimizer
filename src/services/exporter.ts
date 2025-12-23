import * as XLSX from 'xlsx';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { OptimizationResult } from '@/types';

// Set up pdfMake fonts
if (typeof window !== 'undefined') {
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

function generateExcel(
  result: OptimizationResult,
  sourceRows: Record<string, unknown>[],
  options: ExportOptions
): ExportResult {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Optimized Sequence
  const sequenceData = result.sequence.map((order) => {
    const row: Record<string, any> = {
      '#': order.sequenceNumber,
      'Order ID': order.id,
    };
    // Add original values
    Object.entries(order.values).forEach(([key, val]) => {
      row[key] = val;
    });
    // Add changeover info with dual metrics
    row['Downtime (min)'] = order.downtime;
    row['Work Time (min)'] = order.workTime;
    row['Changed Attributes'] = order.changeoverReasons.join(', ') || '—';
    return row;
  });

  const sequenceSheet = XLSX.utils.json_to_sheet(sequenceData);
  XLSX.utils.book_append_sheet(workbook, sequenceSheet, 'Optimized Sequence');

  // Sheet 2: Summary
  if (options.includeSummary) {
    const summaryData = [
      { Metric: 'Total Orders', Value: result.sequence.length },
      { Metric: '', Value: '' },
      { Metric: '=== DOWNTIME (Production Impact) ===', Value: '' },
      { Metric: 'Original Downtime (min)', Value: result.totalDowntimeBefore },
      { Metric: 'Optimized Downtime (min)', Value: result.totalDowntimeAfter },
      { Metric: 'Downtime Savings (min)', Value: result.downtimeSavings },
      { Metric: 'Downtime Reduction (%)', Value: `${result.downtimeSavingsPercent}%` },
      { Metric: '', Value: '' },
      { Metric: '=== WORK TIME (Labor Cost) ===', Value: '' },
      { Metric: 'Original Work Time (min)', Value: result.totalBefore },
      { Metric: 'Optimized Work Time (min)', Value: result.totalAfter },
      { Metric: 'Work Time Savings (min)', Value: result.savings },
      { Metric: 'Work Time Reduction (%)', Value: `${result.savingsPercent}%` },
      { Metric: '', Value: '' },
      { Metric: 'Attribute Breakdown:', Value: '' },
      ...result.attributeStats.map(stat => ({
        Metric: `  ${stat.column}${stat.parallelGroup !== 'default' ? ` (Group ${stat.parallelGroup})` : ''}`,
        Value: `${stat.changeoverCount} changes, ${stat.totalTime} min`
      }))
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Optimization Summary');
  }

  // Sheet 3: Original Data
  if (options.includeOriginal) {
    const originalSheet = XLSX.utils.json_to_sheet(sourceRows);
    XLSX.utils.book_append_sheet(workbook, originalSheet, 'Original Schedule');
  }

  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return {
    data: new Uint8Array(buffer),
    filename: options.filename || 'optimized-schedule.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}

function generateCSV(result: OptimizationResult): ExportResult {
  const data = result.sequence.map((order) => {
    const row: Record<string, any> = {
      sequence: order.sequenceNumber,
      order_id: order.id,
      ...order.values,
      downtime_min: order.downtime,
      work_time_min: order.workTime,
      changed_attributes: order.changeoverReasons.join('; '),
    };
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);

  return {
    data: csv,
    filename: 'optimized-schedule.csv',
    mimeType: 'text/csv',
  };
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
