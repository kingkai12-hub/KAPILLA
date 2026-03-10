/**
 * PDF Helper Functions
 * Reusable utilities for generating consistent, well-formatted PDFs
 */

import jsPDF from 'jspdf';

/**
 * Calculate dynamic height for Bill To section based on content
 * Prevents overflow and overlapping with other sections
 */
export function calculateBillToHeight(
  doc: jsPDF,
  data: {
    customerName: string;
    customerAddress?: string | null;
    customerPhone?: string | null;
    customerTIN?: string | null;
    requisitionNumber?: string | null;
  },
  maxTextWidth: number
): number {
  let contentHeight = 8; // Header height

  // Company name section
  const nameLines = doc.splitTextToSize(data.customerName, maxTextWidth);
  contentHeight += 4 + nameLines.length * 5 + 2; // Label + lines + spacing

  // Address section with line break support
  if (data.customerAddress) {
    // Split by line breaks first to count actual lines
    const addressParts = data.customerAddress.split('\n');
    let totalLines = 0;
    addressParts.forEach((part: string) => {
      const wrappedLines = doc.splitTextToSize(part.trim(), maxTextWidth);
      totalLines += wrappedLines.length;
    });
    contentHeight += 4 + totalLines * 4; // Label + lines (no extra spacing)
  }

  // Phone/TIN row (only add height if at least one exists)
  if (data.customerPhone || data.customerTIN) {
    contentHeight += 2 + 10; // Spacing + row height
  }

  // Requisition section
  if (data.requisitionNumber) {
    const parts = data.requisitionNumber
      .split(/[,;\n]+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    const formatted = parts.length > 0 ? parts.join(', ') : data.requisitionNumber;
    const lines = doc.splitTextToSize(formatted, maxTextWidth);
    const lineHeight = lines.length > 10 ? 3.2 : lines.length > 5 ? 3.6 : 4;
    contentHeight += 4 + lines.length * lineHeight;
  }

  contentHeight += 5; // Bottom padding

  return Math.max(50, contentHeight); // Minimum 50mm, but can grow
}

/**
 * Render Bill To section with dynamic height and text wrapping
 * Prevents content overflow and maintains professional appearance
 */
export function renderBillToSection(
  doc: jsPDF,
  startY: number,
  data: {
    customerName: string;
    customerAddress?: string | null;
    customerPhone?: string | null;
    customerTIN?: string | null;
    requisitionNumber?: string | null;
  },
  options: {
    x?: number;
    width?: number;
    maxTextWidth?: number;
  } = {}
): number {
  const billToX = options.x || 15;
  const billToWidth = options.width || 180;
  const maxTextWidth = options.maxTextWidth || billToWidth - 4;

  // Calculate required height
  const billToHeight = calculateBillToHeight(doc, data, maxTextWidth);

  // Outer border
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.5);
  doc.roundedRect(billToX, startY, billToWidth, billToHeight, 2, 2, 'D');

  // Header with gray background
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(billToX, startY, billToWidth, 8, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(billToX, startY + 8, billToX + billToWidth, startY + 8);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', billToX + 2, startY + 5);

  let yPos = startY + 13;

  // Company/Customer Name with wrapping
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('COMPANY/CUSTOMER NAME', billToX + 2, yPos);
  yPos += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  const nameLines = doc.splitTextToSize(data.customerName, maxTextWidth);
  nameLines.forEach((line: string) => {
    doc.text(line, billToX + 2, yPos);
    yPos += 5;
  });
  yPos += 2;

  // Address with text wrapping and line break preservation
  if (data.customerAddress) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('ADDRESS', billToX + 2, yPos);
    yPos += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    // Split by line breaks first, then wrap each line if needed
    const addressParts = data.customerAddress.split('\n');
    addressParts.forEach((part: string) => {
      const wrappedLines = doc.splitTextToSize(part.trim(), maxTextWidth);
      wrappedLines.forEach((line: string) => {
        doc.text(line, billToX + 2, yPos);
        yPos += 4;
      });
    });
  }

  // Phone and TIN in two columns (only if at least one exists)
  if (data.customerPhone || data.customerTIN) {
    yPos += 2; // Add spacing only if phone/TIN section exists
    const col1X = billToX + 2;
    const col2X = billToX + 90;
    let colY = yPos;

    // If phone exists, show it in left column
    if (data.customerPhone) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('PHONE', col1X, colY);
      colY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(data.customerPhone, col1X, colY);

      // If TIN also exists, show it in right column
      if (data.customerTIN) {
        colY = yPos;
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('TIN NUMBER', col2X, colY);
        colY += 4;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text(data.customerTIN, col2X, colY);
      }
    } else if (data.customerTIN) {
      // No phone, so TIN goes in left column
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('TIN NUMBER', col1X, colY);
      colY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(data.customerTIN, col1X, colY);
    }

    yPos += 10;
  }

  // Requisition Number
  if (data.requisitionNumber) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('REQUISITION/ORDER NO.', billToX + 2, yPos);
    yPos += 4;
    doc.setFont('helvetica', 'normal');
    const parts = data.requisitionNumber
      .split(/[,;\n]+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    const formatted = parts.length > 0 ? parts.join(', ') : data.requisitionNumber;
    const lines = doc.splitTextToSize(formatted, maxTextWidth);
    const reqFontSize = lines.length > 10 ? 7 : lines.length > 5 ? 8 : 9;
    const lineHeight = reqFontSize <= 7 ? 3.2 : reqFontSize <= 8 ? 3.6 : 4;
    doc.setFontSize(reqFontSize);
    doc.setTextColor(0, 0, 0);
    lines.forEach((line: string) => {
      doc.text(line, billToX + 2, yPos);
      yPos += lineHeight;
    });
  }

  // Return the Y position after the Bill To section
  return startY + billToHeight;
}

/**
 * Render items table with proper column headers including currency
 * Handles long descriptions with automatic text wrapping and row height adjustment
 */
export function renderItemsTable(
  doc: jsPDF,
  startY: number,
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>,
  currency: string
): number {
  const tableData = items.map((item) => [
    item.description,
    item.quantity.toString(),
    item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 }),
    item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 }),
  ]);

  // Use autoTable with currency in headers
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const autoTable = require('jspdf-autotable').default;

  autoTable(doc, {
    startY: startY,
    head: [
      [
        'DESCRIPTION',
        'QTY',
        `UNIT PRICE (${currency})`, // Currency in header
        `AMOUNT (${currency})`, // Currency in header
      ],
    ],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
      lineWidth: 0.5,
      lineColor: [203, 213, 225],
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [0, 0, 0],
      lineWidth: 0.5,
      lineColor: [203, 213, 225],
      cellPadding: 4,
      minCellHeight: 10,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: {
        cellWidth: 85, // Wider for description
        halign: 'left',
        cellPadding: 4,
        overflow: 'linebreak', // Enable text wrapping
        valign: 'top',
        fontSize: 8.5,
      },
      1: { cellWidth: 20, halign: 'center', valign: 'middle' },
      2: { cellWidth: 35, halign: 'right', fontStyle: 'normal', valign: 'middle' },
      3: { cellWidth: 35, halign: 'right', fontStyle: 'bold', valign: 'middle' },
    },
    margin: { left: 15, right: 15, bottom: 20 },
    didParseCell: function (data: {
      cell: {
        styles: { minCellHeight: number; cellPadding: number };
        raw: string;
      };
      row: { index: number };
      section: string;
      column: { index: number };
    }) {
      // Ensure minimum row height for body cells
      if (data.section === 'body') {
        data.cell.styles.minCellHeight = 10;
        // Extra padding for description column
        if (data.column.index === 0) {
          data.cell.styles.cellPadding = 4;
        }
      }
    },
    didDrawCell: function (data: {
      cell: { height: number; raw: string };
      row: { index: number };
      section: string;
      column: { index: number };
    }) {
      // Log for debugging if needed
      if (data.section === 'body' && data.column.index === 0 && data.cell.height > 20) {
        console.log(`Row ${data.row.index} has height: ${data.cell.height}mm`);
      }
    },
    
  });

  // Return Y position after table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (doc as any).lastAutoTable.finalY;
}

export function drawFooterOnLastPage(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  doc.setPage(pageCount);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 12;
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  const footerText =
    'KAPILLA GROUP LIMITED • CRDB Bank PLC Oysterbay • TZS: 0150868228800 • USD: 0250868228800 • SWIFT: CORUTZTZ';
  doc.text(footerText, pageWidth / 2, footerY, { align: 'center' });
  const pageLabel = `Page ${pageCount} of ${pageCount}`;
  doc.text(pageLabel, pageWidth - 15, footerY, { align: 'right' });
}
