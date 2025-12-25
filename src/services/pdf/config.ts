/**
 * Shared PDF configuration for pdfMake
 *
 * Centralizes PDF initialization and common styles used across exporters.
 */

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions, StyleDictionary } from 'pdfmake/interfaces';

// ============================================================================
// PDF Initialization
// ============================================================================

let initialized = false;

/**
 * Initialize pdfMake with fonts.
 * Safe to call multiple times - only initializes once.
 */
export function initializePdfMake(): void {
  if (initialized) return;
  if (typeof window !== 'undefined') {
    (pdfMake as any).vfs = (pdfFonts as any).pdfMake.vfs;
    initialized = true;
  }
}

// Auto-initialize on import
initializePdfMake();

// Re-export pdfMake for convenience
export { pdfMake };

// ============================================================================
// Shared Styles
// ============================================================================

/**
 * Common styles used across PDF exports
 */
export const pdfStyles: StyleDictionary = {
  header: {
    fontSize: 10,
    color: '#666666',
  },
  footer: {
    fontSize: 8,
    color: '#999999',
  },
  title: {
    fontSize: 20,
    bold: true,
    color: '#1a56db',
  },
  subheader: {
    fontSize: 16,
    bold: true,
    color: '#1a56db',
  },
  sectionHeader: {
    fontSize: 14,
    bold: true,
    color: '#1a56db',
  },
  tableHeader: {
    bold: true,
    fontSize: 11,
    color: 'black',
    fillColor: '#f3f4f6',
  },
  notes: {
    fontSize: 10,
    italics: true,
  },
  generatedBy: {
    fontSize: 8,
    color: '#999999',
    alignment: 'center' as const,
  },
  highlight: {
    bold: true,
    color: '#1a56db',
  },
  success: {
    color: '#16a34a',
  },
  warning: {
    color: '#d97706',
  },
};

// ============================================================================
// Default Document Options
// ============================================================================

export interface PdfPageOptions {
  pageSize?: 'A4' | 'LETTER' | 'LEGAL';
  pageOrientation?: 'portrait' | 'landscape';
  pageMargins?: [number, number, number, number];
}

/**
 * Default page options for A4 portrait
 */
export const defaultPageOptions: Required<PdfPageOptions> = {
  pageSize: 'A4',
  pageOrientation: 'portrait',
  pageMargins: [40, 60, 40, 60],
};

/**
 * Default page options for A4 landscape
 */
export const landscapePageOptions: Required<PdfPageOptions> = {
  pageSize: 'A4',
  pageOrientation: 'landscape',
  pageMargins: [40, 60, 40, 60],
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a standard header for PDF documents
 */
export function createHeader(text: string): TDocumentDefinitions['header'] {
  return {
    text,
    style: 'header',
    margin: [40, 20, 0, 0],
  };
}

/**
 * Creates a standard footer with version and page numbers
 */
export function createFooter(
  leftText: string
): (currentPage: number, pageCount: number) => any {
  return (currentPage: number, pageCount: number) => ({
    columns: [
      {
        text: leftText,
        alignment: 'left',
        margin: [40, 0, 0, 0],
      },
      {
        text: `Page ${currentPage} of ${pageCount}`,
        alignment: 'right',
        margin: [0, 0, 40, 0],
      },
    ],
    style: 'footer',
  });
}

/**
 * Creates a base document definition with common settings
 */
export function createBaseDocument(
  content: TDocumentDefinitions['content'],
  options: PdfPageOptions & {
    headerText?: string;
    footerLeftText?: string;
  } = {}
): TDocumentDefinitions {
  const pageOpts = {
    ...defaultPageOptions,
    ...options,
  };

  const doc: TDocumentDefinitions = {
    pageSize: pageOpts.pageSize,
    pageOrientation: pageOpts.pageOrientation,
    pageMargins: pageOpts.pageMargins,
    content,
    styles: pdfStyles,
    defaultStyle: {
      fontSize: 10,
    },
  };

  if (options.headerText) {
    doc.header = createHeader(options.headerText);
  }

  if (options.footerLeftText) {
    doc.footer = createFooter(options.footerLeftText);
  }

  return doc;
}

/**
 * Generate PDF as Uint8Array
 */
export function generatePdfBuffer(
  docDefinition: TDocumentDefinitions
): Promise<Uint8Array> {
  return new Promise((resolve) => {
    const pdfDoc = pdfMake.createPdf(docDefinition);
    pdfDoc.getBuffer((buffer) => {
      resolve(new Uint8Array(buffer));
    });
  });
}

/**
 * Download PDF in browser
 */
export function downloadPdf(
  docDefinition: TDocumentDefinitions,
  filename: string
): void {
  const pdfDoc = pdfMake.createPdf(docDefinition);
  pdfDoc.download(filename);
}

/**
 * Open PDF in new tab
 */
export function openPdfInNewTab(docDefinition: TDocumentDefinitions): void {
  const pdfDoc = pdfMake.createPdf(docDefinition);
  pdfDoc.open();
}
