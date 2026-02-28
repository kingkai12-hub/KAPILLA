import { NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs';
import path from 'path';
import { renderBillToSection, renderItemsTable } from '../../../../../lib/pdf-helpers';

export const dynamic = 'force-dynamic';

async function getDb() {
  const { db } = await import('../../../../../lib/db');
  return db;
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(context.params);
    const db = await getDb();

    // Check if this is a delivery note request
    const url = new URL(req.url);
    const isDeliveryNote = url.searchParams.get('type') === 'delivery-note';

    const invoice = await db.invoice.findUnique({
      where: { id: params.id },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Generate delivery note if requested
    if (isDeliveryNote) {
      return generateDeliveryNote(invoice);
    }

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Create PDF
    const doc = new jsPDF();
    const isProforma = invoice.type === 'PROFORMA';

    // Colors - matching HTML design (both use dark blue)
    const accentColor = [37, 99, 235]; // dark blue for both
    const lightAccentBg = [239, 246, 255]; // light blue for both

    // Header - WHITE with BLACK BORDER (matching HTML)
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 50, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.line(0, 50, 210, 50);

    // Logo with proper aspect ratio (40x25mm to maintain proportions) - vertically centered
    try {
      const logoPath = path.join(process.cwd(), 'assets', 'kapila logo.png');
      const logoData = fs.readFileSync(logoPath);
      const logoBase64 = logoData.toString('base64');
      doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', 10, 12.5, 40, 25);
    } catch (e) {
      console.error('Logo load error:', e);
      // Fallback: show text if logo fails
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('KAPILLA', 15, 25);
    }

    // Company details (right side of logo) - vertically centered
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('KAPILLA GROUP LIMITED', 55, 18);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('P.O. BOX 71729, Dar es Salaam, Tanzania', 55, 24);
    doc.text('Tel: +255 65 860 4772 / +255 76 062 9563', 55, 29);
    doc.text('Email: kapillagroup@gmail.com', 55, 34);
    doc.text('TIN: 157-935-380', 55, 39);

    // Invoice Type Box - with colored background and border
    const boxX = 140;
    const boxY = 10;
    const boxW = 55;
    const boxH = 35;

    doc.setFillColor(lightAccentBg[0], lightAccentBg[1], lightAccentBg[2]);
    doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(boxX, boxY, boxW, boxH, 2, 2, 'FD');

    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const invoiceType = isProforma ? 'PROFORMA INVOICE' : 'INVOICE';
    doc.text(invoiceType, boxX + boxW / 2, boxY + 8, { align: 'center' });

    // Invoice Details
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    let detailY = boxY + 15;
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice #:', boxX + 3, detailY);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoiceNumber, boxX + boxW - 3, detailY, { align: 'right' });

    detailY += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', boxX + 3, detailY);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleDateString('en-GB'), boxX + boxW - 3, detailY, {
      align: 'right',
    });

    if (invoice.validUntil) {
      detailY += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Valid Until:', boxX + 3, detailY);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date(invoice.validUntil).toLocaleDateString('en-GB'), boxX + boxW - 3, detailY, {
        align: 'right',
      });
    }

    // Bill To Section - using helper function with dynamic height
    let yPos = 58;
    yPos = renderBillToSection(doc, yPos, {
      customerName: invoice.customerName,
      customerAddress: invoice.customerAddress,
      customerPhone: invoice.customerPhone,
      customerTIN: invoice.customerTIN,
      requisitionNumber: invoice.requisitionNumber,
    });

    // Items Table - starts after Bill To section with proper spacing
    yPos += 5; // 5mm spacing after Bill To section
    yPos = renderItemsTable(
      doc,
      yPos,
      invoice.items.map(
        (item: { description: string; quantity: number; unitPrice: number; amount: number }) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
        })
      ),
      invoice.currency || 'TZS'
    );

    // Get final Y position after table - REDUCED SPACING
    yPos += 5; // Reduced from 10mm to 5mm

    // Check if we need a new page for totals section
    const pageHeight = doc.internal.pageSize.getHeight();
    const remainingSpace = pageHeight - yPos;
    const totalsHeight = isProforma ? 45 : 70; // Estimated height needed for totals + footer

    if (remainingSpace < totalsHeight) {
      doc.addPage();
      yPos = 20; // Start from top of new page with margin
    }

    // Bank Details and Totals Section
    if (!isProforma) {
      // Two column layout: Bank Details (left) and Totals (right)
      const bankBoxX = 15;
      const bankBoxY = yPos;
      const bankBoxW = 85;
      const bankBoxH = 50; // Compact height

      // Bank Details Box
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineWidth(0.5);
      doc.roundedRect(bankBoxX, bankBoxY, bankBoxW, bankBoxH, 2, 2, 'FD');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('PAYMENT INFORMATION', bankBoxX + 3, bankBoxY + 5);

      let bankY = bankBoxY + 10;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text('Bank:', bankBoxX + 3, bankY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('CRDB Bank PLC - OYSTERBAY', bankBoxX + 15, bankY);

      bankY += 6;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Account:', bankBoxX + 3, bankY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('KAPILLA GROUP LIMITED', bankBoxX + 15, bankY);

      bankY += 6;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('TZS:', bankBoxX + 3, bankY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('0150868228800', bankBoxX + 15, bankY);

      bankY += 6;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('USD:', bankBoxX + 3, bankY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('0250868228800', bankBoxX + 15, bankY);

      bankY += 6;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Swift:', bankBoxX + 3, bankY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('CORUTZTZ', bankBoxX + 15, bankY);

      // Totals Box (right side) - COMPACT
      const totalsBoxX = 110;
      const totalsBoxY = yPos;
      const totalsBoxW = 85;
      const totalsBoxH = 50; // Match bank box height

      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(totalsBoxX, totalsBoxY, totalsBoxW, totalsBoxH, 2, 2, 'FD');

      let totalsY = totalsBoxY + 7;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('Subtotal:', totalsBoxX + 5, totalsY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(
        `${invoice.currency} ${invoice.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        totalsBoxX + totalsBoxW - 5,
        totalsY,
        { align: 'right' }
      );

      if (invoice.taxRate > 0) {
        totalsY += 5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`VAT (${invoice.taxRate}%):`, totalsBoxX + 5, totalsY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(
          `${invoice.currency} ${invoice.taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          totalsBoxX + totalsBoxW - 5,
          totalsY,
          { align: 'right' }
        );
      }

      if (invoice.discount > 0) {
        totalsY += 5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 128, 0);
        doc.text('Discount:', totalsBoxX + 5, totalsY);
        doc.setFont('helvetica', 'bold');
        doc.text(
          `- ${invoice.currency} ${invoice.discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          totalsBoxX + totalsBoxW - 5,
          totalsY,
          { align: 'right' }
        );
      }

      totalsY += 7;
      doc.setDrawColor(25, 55, 109); // Dark blue
      doc.setLineWidth(0.8);
      doc.line(totalsBoxX + 5, totalsY - 2, totalsBoxX + totalsBoxW - 5, totalsY - 2);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text('TOTAL:', totalsBoxX + 5, totalsY + 4);
      doc.setTextColor(25, 55, 109); // Dark blue
      doc.setFontSize(14);
      doc.text(
        `${invoice.currency} ${invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        totalsBoxX + totalsBoxW - 5,
        totalsY + 4,
        { align: 'right' }
      );

      yPos = Math.max(bankBoxY + bankBoxH, totalsBoxY + totalsBoxH) + 5; // Reduced from 10mm to 5mm
    } else {
      // Proforma: Only Totals (compact, right-aligned)
      const totalsBoxX = 110;
      const totalsBoxY = yPos;
      const totalsBoxW = 85;
      const totalsBoxH = 30; // Compact height

      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.5);
      doc.roundedRect(totalsBoxX, totalsBoxY, totalsBoxW, totalsBoxH, 2, 2, 'FD');

      let totalsY = totalsBoxY + 7;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('Subtotal:', totalsBoxX + 5, totalsY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(
        `${invoice.currency} ${invoice.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        totalsBoxX + totalsBoxW - 5,
        totalsY,
        { align: 'right' }
      );

      if (invoice.taxRate > 0) {
        totalsY += 5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`VAT (${invoice.taxRate}%):`, totalsBoxX + 5, totalsY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(
          `${invoice.currency} ${invoice.taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          totalsBoxX + totalsBoxW - 5,
          totalsY,
          { align: 'right' }
        );
      }

      if (invoice.discount > 0) {
        totalsY += 5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 128, 0);
        doc.text('Discount:', totalsBoxX + 5, totalsY);
        doc.setFont('helvetica', 'bold');
        doc.text(
          `- ${invoice.currency} ${invoice.discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          totalsBoxX + totalsBoxW - 5,
          totalsY,
          { align: 'right' }
        );
      }

      totalsY += 7;
      doc.setDrawColor(25, 55, 109); // Dark blue
      doc.setLineWidth(0.8);
      doc.line(totalsBoxX + 5, totalsY - 2, totalsBoxX + totalsBoxW - 5, totalsY - 2);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text('TOTAL:', totalsBoxX + 5, totalsY + 4);
      doc.setTextColor(25, 55, 109); // Dark blue
      doc.setFontSize(14);
      doc.text(
        `${invoice.currency} ${invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        totalsBoxX + totalsBoxW - 5,
        totalsY + 4,
        { align: 'right' }
      );

      yPos = totalsBoxY + totalsBoxH + 5; // Reduced from 10mm to 5mm
    }

    // Notes
    if (invoice.notes) {
      // Check if we need a new page
      const notesPageHeight = doc.internal.pageSize.getHeight();
      const remainingSpace = notesPageHeight - yPos;
      const notesHeight = 25; // Estimated height

      if (remainingSpace < notesHeight) {
        doc.addPage();
        yPos = 20;
      }

      // Notes box with amber styling - DYNAMIC HEIGHT
      const splitNotes = doc.splitTextToSize(invoice.notes, 170); // Reduced width for padding
      const notesTextHeight = splitNotes.length * 4; // 4mm per line
      const actualNotesHeight = Math.max(15, notesTextHeight + 10); // Min 15mm, or text height + padding

      doc.setFillColor(254, 252, 232); // amber-50
      doc.setDrawColor(251, 191, 36); // amber-400
      doc.setLineWidth(1);
      doc.rect(15, yPos, 180, actualNotesHeight, 'FD');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Notes', 17, yPos + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85); // slate-700
      doc.text(splitNotes, 17, yPos + 10);
      yPos += actualNotesHeight + 3; // Reduced from 5mm to 3mm
    }

    // Terms & Conditions
    if (invoice.terms) {
      // Check if we need a new page
      const termsPageHeight = doc.internal.pageSize.getHeight();
      const remainingSpace = termsPageHeight - yPos;
      const termsHeight = 30; // Estimated height

      if (remainingSpace < termsHeight) {
        doc.addPage();
        yPos = 20;
      }

      // Terms box with slate styling - DYNAMIC HEIGHT
      const splitTerms = doc.splitTextToSize(invoice.terms, 170); // Reduced width for padding
      const termsTextHeight = splitTerms.length * 4; // 4mm per line
      const actualTermsHeight = Math.max(15, termsTextHeight + 10); // Min 15mm, or text height + padding

      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineWidth(0.5);
      doc.roundedRect(15, yPos, 180, actualTermsHeight, 2, 2, 'FD');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Terms & Conditions', 17, yPos + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(splitTerms, 17, yPos + 10);
      yPos += actualTermsHeight + 3; // Reduced from 5mm to 3mm
    }

    // Footer - ensure it's on the last page
    const footerPageHeight = doc.internal.pageSize.getHeight();
    const footerHeight = 30;

    // If not enough space for footer, add new page
    if (yPos > footerPageHeight - footerHeight) {
      doc.addPage();
      yPos = footerPageHeight - footerHeight;
    } else {
      // Position footer at bottom of current page
      yPos = Math.max(yPos, footerPageHeight - footerHeight);
    }
    doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setLineWidth(0.5);
    doc.line(15, yPos, 195, yPos);

    yPos += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Thank you for your business!', 105, yPos, { align: 'center' });

    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105); // slate-600
    const contactText =
      'For any questions regarding this invoice, please contact us at kapillagroup@gmail.com or +255 65 860 4772';
    const splitContact = doc.splitTextToSize(contactText, 180);
    doc.text(splitContact, 105, yPos, { align: 'center' });

    yPos += splitContact.length * 4 + 4;
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('This is a computer-generated document. No signature is required.', 105, yPos, {
      align: 'center',
    });
    yPos += 4;
    doc.text(
      'KAPILLA GROUP LIMITED | P.O. BOX 71729, Dar es Salaam, Tanzania | TIN: 157-935-380',
      105,
      yPos,
      { align: 'center' }
    );

    // Add page numbers if multiple pages
    const pageCount = doc.getNumberOfPages();
    if (pageCount > 1) {
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.getWidth() - 20,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'right' }
        );
      }
    }

    // Generate PDF as buffer
    const pdfBuffer = doc.output('arraybuffer');

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[INVOICE_PDF]', error);
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Generate delivery note PDF
function generateDeliveryNote(invoice: {
  invoiceNumber: string;
  customerName: string;
  customerAddress: string | null;
  customerPhone: string | null;
  customerTIN: string | null;
  requisitionNumber: string | null;
  items: Array<{ description: string; quantity: number }>;
}) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Load logo
  const logoPath = path.join(process.cwd(), 'assets', 'kapila logo.png');
  let logoBase64 = '';
  try {
    const logoBuffer = fs.readFileSync(logoPath);
    logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Logo not found:', error);
  }

  // Header with logo (transparent PNG with blue details only)
  const logoWidth = 38; // width in mm (keeps header compact)
  const logoHeight = 24; // height in mm (preserves original aspect ratio)
  const logoX = 15; // left margin
  const headerY = 14; // slight upward shift to balance spacing

  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', logoX, headerY, logoWidth, logoHeight);
  }

  // Company details on the right side - UNIFORM FONT SIZE
  const detailsX = 60; // start closer to logo to reduce empty space
  doc.setFontSize(9); // slightly smaller for compact header
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('KAPILLA GROUP LIMITED', detailsX, headerY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text('P.O. BOX 71729, Dar es Salaam, Tanzania', detailsX, headerY + 11);
  doc.text('Tel: +255 65 860 4772 / +255 76 062 9563', detailsX, headerY + 16);
  doc.text('Email: kapillagroup@gmail.com', detailsX, headerY + 21);
  doc.text('TIN: 157-935-380', detailsX, headerY + 26);

  // Separator line between header and body - more compact
  const separatorY = headerY + logoHeight + 4;
  doc.setDrawColor(37, 99, 235); // blue-600
  doc.setLineWidth(0.6);
  doc.line(15, separatorY, 195, separatorY);

  // Document title below separator - smaller, more compact
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235); // blue-600
  doc.text('DELIVERY NOTE', pageWidth / 2, separatorY + 7, { align: 'center' });

  // Document info (below title) - adjusted for more compact header
  let yPos = separatorY + 12;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  doc.text(`Delivery Note No: DN-${invoice.invoiceNumber}`, 15, yPos);
  doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 15, yPos + 5);
  doc.text(`Invoice No: ${invoice.invoiceNumber}`, 15, yPos + 10);

  // Customer details box - using helper function
  yPos += 20;
  yPos = renderBillToSection(doc, yPos, {
    customerName: invoice.customerName,
    customerAddress: invoice.customerAddress,
    customerPhone: invoice.customerPhone,
    customerTIN: invoice.customerTIN,
    requisitionNumber: invoice.requisitionNumber,
  });

  // Items table
  yPos += 5;
  const tableData = invoice.items.map((item: { description: string; quantity: number }) => [
    item.description,
    item.quantity.toString(),
    '',
    '',
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Qty', 'Received Qty', 'Remarks']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 35, halign: 'center' },
      3: { cellWidth: 45 },
    },
    margin: { left: 15, right: 15 },
  });

  // Signature section - THREE SECTIONS: Delivered, Received, and Inspected
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Section 1: Delivered by (Left)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235); // blue-600
  doc.text('DELIVERED BY:', 15, yPos);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.rect(15, yPos + 2, 85, 35);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('Name: _______________________', 17, yPos + 10);
  doc.text('Signature: ___________________', 17, yPos + 18);
  doc.text('Date: ________________________', 17, yPos + 26);
  doc.text('Time: ________________________', 17, yPos + 33);

  // Section 2: Received by (Right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(16, 185, 129); // green-500
  doc.text('RECEIVED BY:', 110, yPos);

  doc.setDrawColor(203, 213, 225);
  doc.rect(110, yPos + 2, 85, 35);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('Name: _______________________', 112, yPos + 10);
  doc.text('Signature: ___________________', 112, yPos + 18);
  doc.text('Date: ________________________', 112, yPos + 26);
  doc.text('ID No: _______________________', 112, yPos + 33);

  yPos += 42;

  // Section 3: Inspected/Checked by (Full width)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(234, 88, 12); // orange-600
  doc.text('INSPECTED/CHECKED BY (Cargo Verification):', 15, yPos);

  doc.setDrawColor(203, 213, 225);
  doc.rect(15, yPos + 2, 180, 35);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('Inspector Name: ___________________________', 17, yPos + 10);
  doc.text('Position/Title: ____________________________', 17, yPos + 18);
  doc.text('Signature: ___________________', 17, yPos + 26);
  doc.text('Date: ________________________', 17, yPos + 33);

  doc.text('Verification Status:', 110, yPos + 10);
  doc.text('[ ] All items received as ordered', 112, yPos + 18);
  doc.text('[ ] Items received with discrepancies', 112, yPos + 26);
  doc.text('Remarks: _____________________', 112, yPos + 33);

  yPos += 40;

  // Footer
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, 195, yPos);

  yPos += 5;
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'bold');
  doc.text(
    'IMPORTANT: This delivery note must be signed by both the receiver and cargo inspector.',
    pageWidth / 2,
    yPos,
    { align: 'center' }
  );
  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(
    'This is a computer-generated document. Please sign and return a copy to the driver.',
    pageWidth / 2,
    yPos,
    { align: 'center' }
  );

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="delivery-note-${invoice.invoiceNumber}.pdf"`,
    },
  });
}
