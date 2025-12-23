import { describe, it, expect, vi } from 'vitest';
import { generateExport } from './exporter';
import { OptimizationResult } from '@/types';

// Mock XLSX
vi.mock('xlsx', () => ({
  utils: {
    book_new: vi.fn(() => ({})),
    json_to_sheet: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
    sheet_to_csv: vi.fn(() => 'csv,data'),
  },
  write: vi.fn(() => new ArrayBuffer(8)),
}));

// Mock pdfmake
vi.mock('pdfmake/build/pdfmake', () => ({
  default: {
    createPdf: vi.fn(() => ({
      getBuffer: vi.fn((cb) => cb(new ArrayBuffer(8))),
    })),
  },
}));

vi.mock('pdfmake/build/vfs_fonts', () => ({
  default: {
    pdfMake: { vfs: {} },
  },
}));

describe('Exporter Service', () => {
  const result: OptimizationResult = {
    sequence: [
      {
        id: '1',
        originalIndex: 0,
        values: { Color: 'Red' },
        sequenceNumber: 1,
        changeoverTime: 0,
        changeoverReasons: [],
        workTime: 0,
        downtime: 0,
      }
    ],
    totalBefore: 10,
    totalAfter: 0,
    savings: 10,
    savingsPercent: 100,
    totalDowntimeBefore: 10,
    totalDowntimeAfter: 0,
    downtimeSavings: 10,
    downtimeSavingsPercent: 100,
    attributeStats: [
      { column: 'Color', changeoverCount: 0, totalTime: 0, parallelGroup: 'default' }
    ],
  };

  it('should generate CSV data', async () => {
    const exportResult = await generateExport(result, [], { 
      format: 'csv', 
      includeSummary: false, 
      includeOriginal: false 
    });
    expect(exportResult.mimeType).toBe('text/csv');
    expect(typeof exportResult.data).toBe('string');
  });

  it('should generate Clipboard data (TSV)', async () => {
    const exportResult = await generateExport(result, [], { 
      format: 'clipboard', 
      includeSummary: false, 
      includeOriginal: false 
    });
    expect(exportResult.mimeType).toBe('text/plain');
    expect(exportResult.data).toContain('Order ID');
  });

  it('should generate Excel data (buffer)', async () => {
    const exportResult = await generateExport(result, [], { 
      format: 'xlsx', 
      includeSummary: true, 
      includeOriginal: true 
    });
    expect(exportResult.mimeType).toContain('spreadsheet');
    expect(exportResult.data).toBeInstanceOf(Uint8Array);
  });

  it('should generate PDF data (buffer)', async () => {
    const exportResult = await generateExport(result, [], { 
      format: 'pdf', 
      includeSummary: true, 
      includeOriginal: false 
    });
    expect(exportResult.mimeType).toBe('application/pdf');
    expect(exportResult.data).toBeInstanceOf(Uint8Array);
  });
});


