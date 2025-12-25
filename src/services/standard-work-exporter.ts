import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { Standard } from '@/types/smed';

// Initialize pdfMake fonts
if (typeof window !== 'undefined') {
  (pdfMake as any).vfs = (pdfFonts as any).pdfMake.vfs;
}

interface ExportOptions {
  studyName: string;
  filename?: string;
}

export async function exportStandardWorkPDF(
  standard: Standard,
  options: ExportOptions
): Promise<void> {
  // Build document definition
  const docDefinition: any = {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [40, 60, 40, 60],

    header: {
      text: `Standard Work - ${options.studyName}`,
      style: 'header',
      margin: [40, 20, 0, 0],
    },

    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        {
          text: `Version ${standard.version}`,
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
    }),

    content: [
      // Title
      {
        text: 'Standard Changeover Procedure',
        style: 'title',
        margin: [0, 0, 0, 20],
      },

      // Summary Box
      {
        table: {
          widths: ['*', '*'],
          body: [
            [
              { text: 'Standard Time', style: 'tableHeader' },
              { text: 'Version', style: 'tableHeader' },
            ],
            [
              `${Math.round(standard.standardTimeMinutes)} minutes`,
              `${standard.version}`,
            ],
            [
              { text: 'Published Date', style: 'tableHeader' },
              { text: 'Published By', style: 'tableHeader' },
            ],
            [
              standard.publishedAt
                ? new Date(standard.publishedAt).toLocaleDateString()
                : '—',
              standard.publishedBy || '—',
            ],
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20],
      },

      // Steps Table
      {
        text: 'Changeover Steps',
        style: 'subheader',
        margin: [0, 0, 0, 10],
      },
      {
        table: {
          headerRows: 1,
          widths: ['auto', '*', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: '#', style: 'tableHeader' },
              { text: 'Description', style: 'tableHeader' },
              { text: 'Time', style: 'tableHeader' },
              { text: 'Category', style: 'tableHeader' },
              { text: 'Type', style: 'tableHeader' },
            ],
            ...standard.steps.map((step, idx) => [
              (idx + 1).toString(),
              step.description,
              `${Math.round(step.durationSeconds / 60)}m`,
              step.category,
              {
                text: step.operationType,
                fillColor: step.operationType === 'internal' ? '#fee2e2' : '#dcfce7',
              },
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20],
      },

      // Tools Required
      ...(standard.toolsRequired.length > 0 ? [
        {
          text: 'Tools Required',
          style: 'subheader',
          margin: [0, 0, 0, 10],
        },
        {
          ul: standard.toolsRequired,
          margin: [0, 0, 0, 20],
        },
      ] : []),

      // Safety Precautions
      ...(standard.safetyPrecautions ? [
        {
          text: 'Safety Precautions',
          style: 'subheader',
          margin: [0, 0, 0, 10],
        },
        {
          text: standard.safetyPrecautions,
          fillColor: '#fef9c3',
          margin: [10, 10, 10, 10],
          border: [false, false, false, false],
        },
      ] : []),

      // Notes
      ...(standard.notes ? [
        {
          text: 'Notes',
          style: 'subheader',
          margin: [0, 20, 0, 10],
        },
        {
          text: standard.notes,
          style: 'notes',
        },
      ] : []),

      // Footer text
      {
        text: '🤖 Generated with ChangeoverOptimizer Pro',
        style: 'generatedBy',
        margin: [0, 30, 0, 0],
      },
    ],

    styles: {
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
        alignment: 'center',
      },
    },
    defaultStyle: {
      fontSize: 10,
    },
  };

  // Generate and download PDF
  const pdfDoc = pdfMake.createPdf(docDefinition);
  const filename = options.filename || `standard-work-v${standard.version}.pdf`;
  pdfDoc.download(filename);
}
