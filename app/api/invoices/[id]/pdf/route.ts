import { NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs';
import path from 'path';
import { renderBillToSection, renderItemsTable, renderItemsTableCompact } from '../../../../../lib/pdf-helpers';

export const dynamic = 'force-dynamic';

async function getDb() {
  const { db } = await import('../../../../../lib/db');
  return db;
}

// ─── POST: Generate PDF with attached evidence photo ─────────────────────────
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(context.params);
    const db = await getDb();
    const formData = await req.formData();
    const photoFile = formData.get('photo') as File | null;

    let photoBase64: string | null = null;
    let photoMime = 'image/jpeg';

    if (photoFile && photoFile.size > 0) {
      const buffer = await photoFile.arrayBuffer();
      photoBase64 = Buffer.from(buffer).toString('base64');
      photoMime = photoFile.type || 'image/jpeg';
    }

    const invoice = await db.invoice.findUnique({
      where: { id: params.id },
      include: { items: { orderBy: { order: 'asc' } } },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return buildInvoicePDF(invoice, photoBase64, photoMime);
  } catch (error) {
    console.error('[INVOICE_PDF_POST]', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ─── GET: Generate PDF (optionally with blank evidence page) ─────────────────
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

    return buildInvoicePDF(invoice, null, 'image/jpeg');
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

// ─── Shared PDF builder ───────────────────────────────────────────────────────
function buildInvoicePDF(
  invoice: {
    invoiceNumber: string;
    type: string;
    customerName: string;
    customerAddress: string | null;
    customerPhone: string | null;
    customerTIN: string | null;
    requisitionNumber: string | null;
    validUntil: Date | null;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    discount: number;
    total: number;
    currency: string;
    notes: string | null;
    terms: string | null;
    itemsHeader: string | null;
    items: Array<{ description: string; quantity: number; unitPrice: number; amount: number }>;
  },
  photoBase64: string | null,
  photoMime: string
): NextResponse {
  try {
    const doc = new jsPDF();
    const isProforma = invoice.type === 'PROFORMA';
    const itemCount = invoice.items.length;
    const reqParts =
      (invoice.requisitionNumber || '')
        .split(/[,;\n]+/)
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 0).length || 0;
    const notesLen = (invoice.notes || '').length;
    const termsLen = (invoice.terms || '').length;
    const forceCompact =
      itemCount >= 12 ||
      reqParts >= 6 ||
      notesLen > 200 ||
      termsLen > 200;

    // Colors - matching HTML design (both use dark blue)
    const accentColor = [37, 99, 235]; // dark blue for both
    const lightAccentBg = [239, 246, 255]; // light blue for both

    // Header - WHITE with BLACK BORDER (matching HTML)
    const headerH = forceCompact ? 45 : 50;
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, headerH, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.line(0, headerH, 210, headerH);

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
    doc.text('P.O Box 71729', 55, 24);
    doc.text('Sea Cliff Village, 10 Toure Drive, Msasani', 55, 29);
    doc.text('Dar es Salaam, Tanzania', 55, 34);
    doc.text('Tel: +255 65 860 4772 / +255 76 062 9563', 55, 39);
    doc.text('Email: info@kapillagroup.co.tz', 55, 44);
    doc.text('TIN: 157-935-380', 55, 49);

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
    yPos += forceCompact ? 3 : 5;
    yPos = (forceCompact ? renderItemsTableCompact : renderItemsTable)(
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
      invoice.currency || 'TZS',
      invoice.itemsHeader
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
      doc.text('Bank Name:', bankBoxX + 3, bankY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('CRDB Bank PLC', bankBoxX + 22, bankY);

      bankY += 5;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Branch:', bankBoxX + 3, bankY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('OYSTERBAY', bankBoxX + 22, bankY);

      bankY += 5;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Account Name:', bankBoxX + 3, bankY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('KAPILLA GROUP LIMITED', bankBoxX + 22, bankY);

      bankY += 5;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('TZS Account:', bankBoxX + 3, bankY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('0150868228800', bankBoxX + 22, bankY);

      bankY += 5;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('USD Account:', bankBoxX + 3, bankY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('0250868228800', bankBoxX + 22, bankY);

      bankY += 5;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Swift Code:', bankBoxX + 3, bankY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('CORUTZTZ', bankBoxX + 22, bankY);

      bankY += 6;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(bankBoxX + 3, bankY, bankBoxX + bankBoxW - 3, bankY);
      bankY += 3;
      doc.setFontSize(6);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      const refText = doc.splitTextToSize('Please include invoice number in payment reference', bankBoxW - 6);
      doc.text(refText, bankBoxX + 3, bankY);

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
      // Proforma: Add Bank Details (left) and Totals (right) - compact
      // Bank Details Box (left)
      const bankBoxX = 15;
      const bankBoxY = yPos;
      const bankBoxW = 85;
      const bankBoxH = forceCompact ? 42 : 45;

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
      doc.text('Bank Name:', bankBoxX + 3, bankY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('CRDB Bank PLC', bankBoxX + 22, bankY);

      bankY += 5;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Branch:', bankBoxX + 3, bankY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('OYSTERBAY', bankBoxX + 22, bankY);

      bankY += 5;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Account Name:', bankBoxX + 3, bankY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('KAPILLA GROUP LIMITED', bankBoxX + 22, bankY);

      bankY += 5;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('TZS Account:', bankBoxX + 3, bankY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('0150868228800', bankBoxX + 22, bankY);

      bankY += 5;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('USD Account:', bankBoxX + 3, bankY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('0250868228800', bankBoxX + 22, bankY);

      bankY += 5;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Swift Code:', bankBoxX + 3, bankY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('CORUTZTZ', bankBoxX + 22, bankY);

      bankY += 6;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(bankBoxX + 3, bankY, bankBoxX + bankBoxW - 3, bankY);
      bankY += 3;
      doc.setFontSize(6);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      const refText = doc.splitTextToSize(
        'Please include invoice number in payment reference',
        bankBoxW - 6
      );
      doc.text(refText, bankBoxX + 3, bankY);

      // Totals Box (right)
      const totalsBoxX = 110;
      const totalsBoxY = yPos;
      const totalsBoxW = 85;
      const totalsBoxH = forceCompact ? 28 : 30;

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

      // Advance Y based on the taller of the two boxes
      yPos = Math.max(bankBoxY + bankBoxH, totalsBoxY + totalsBoxH) + 5;
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

    // Footer - ensure it's on the last page, and show minimal details if space is tight
    const footerPageHeight = doc.internal.pageSize.getHeight();
    const contentEndY = yPos;
    const fullFooterHeight = 30;
    const minimalFooterHeight = 12;
    const footerRemainingSpace = footerPageHeight - contentEndY;

    const useMinimalFooter = footerRemainingSpace < fullFooterHeight;
    const footerHeight = useMinimalFooter ? minimalFooterHeight : fullFooterHeight;

    yPos = footerPageHeight - footerHeight;
    doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setLineWidth(0.5);
    doc.line(15, yPos, 195, yPos);

    yPos += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Thank you for your business!', 105, yPos, { align: 'center' });

    if (!useMinimalFooter) {
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105); // slate-600
      const contactText =
        'For any questions regarding this invoice, please contact us at info@kapillagroup.co.tz or +255 65 860 4772';
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
        'KAPILLA GROUP LIMITED | P.O Box 71729, Sea Cliff Village, 10 Toure Drive, Msasani, Dar es Salaam, Tanzania | TIN: 157-935-380',
        105,
        yPos,
        { align: 'center' }
      );
    }

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

    // ─── Evidence Photo Page (Proforma only) ──────────────────────────────────
    if (invoice.type === 'PROFORMA') {
      doc.addPage();
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();

      // Page header bar
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, pw, 18, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('EVIDENCE / CONFIRMATION PHOTO', pw / 2, 11, { align: 'center' });

      // Invoice reference
      doc.setFillColor(239, 246, 255);
      doc.rect(0, 18, pw, 10, 'F');
      doc.setTextColor(37, 99, 235);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Proforma Invoice: ${invoice.invoiceNumber}  |  Customer: ${invoice.customerName}`, pw / 2, 25, { align: 'center' });

      if (photoBase64) {
        // Embed actual photo - fit within a bordered frame
        const frameX = 15;
        const frameY = 35;
        const frameW = pw - 30;
        const frameH = ph - 80;

        // Border frame
        doc.setDrawColor(37, 99, 235);
        doc.setLineWidth(0.8);
        doc.rect(frameX, frameY, frameW, frameH, 'D');

        // Embed image - determine format from mime
        const imgFormat = photoMime.includes('png') ? 'PNG' : 'JPEG';
        const imgData = `data:${photoMime};base64,${photoBase64}`;

        // Calculate image dimensions to fit frame while maintaining aspect ratio
        // We'll add it centered within the frame with 5mm padding
        const padding = 5;
        doc.addImage(
          imgData,
          imgFormat,
          frameX + padding,
          frameY + padding,
          frameW - padding * 2,
          frameH - padding * 2,
          undefined,
          'FAST'
        );

        // Caption below frame
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 116, 139);
        doc.text('Photo evidence attached for confirmation of proforma invoice items.', pw / 2, frameY + frameH + 8, { align: 'center' });
      } else {
        // Blank placeholder with instructions
        const frameX = 15;
        const frameY = 35;
        const frameW = pw - 30;
        const frameH = ph - 90;

        // Dashed border
        doc.setDrawColor(150, 180, 240);
        doc.setLineWidth(0.5);
        doc.setLineDashPattern([3, 2], 0);
        doc.rect(frameX, frameY, frameW, frameH, 'D');
        doc.setLineDashPattern([], 0);

        // Placeholder icon area
        doc.setFillColor(239, 246, 255);
        doc.roundedRect(frameX + 2, frameY + 2, frameW - 4, frameH - 4, 3, 3, 'F');

        doc.setTextColor(150, 180, 240);
        doc.setFontSize(40);
        doc.text('📎', pw / 2 - 8, frameY + frameH / 2 - 15, { align: 'center' });

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 140, 220);
        doc.text('ATTACH EVIDENCE PHOTO HERE', pw / 2, frameY + frameH / 2 + 5, { align: 'center' });

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 160, 180);
        doc.text('Use the "Print with Photo" button on the invoice page to attach a photo.', pw / 2, frameY + frameH / 2 + 15, { align: 'center' });
        doc.text('Supported formats: JPG, PNG, HEIC', pw / 2, frameY + frameH / 2 + 22, { align: 'center' });

        // Signature / stamp area at bottom of placeholder
        const sigY = frameY + frameH - 25;
        doc.setDrawColor(180, 200, 230);
        doc.setLineWidth(0.3);
        doc.line(frameX + 15, sigY, frameX + 85, sigY);
        doc.line(frameX + frameW - 85, sigY, frameX + frameW - 15, sigY);
        doc.setFontSize(7);
        doc.setTextColor(150, 160, 180);
        doc.text('Authorized Signature', frameX + 50, sigY + 5, { align: 'center' });
        doc.text('Company Stamp', frameX + frameW - 50, sigY + 5, { align: 'center' });
      }

      // Footer
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.line(15, ph - 12, pw - 15, ph - 12);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('KAPILLA GROUP LIMITED  |  info@kapillagroup.co.tz  |  TIN: 157-935-380', pw / 2, ph - 7, { align: 'center' });
    }

    // Update page numbers to include the new evidence page
    const finalPageCount = doc.getNumberOfPages();
    for (let i = 1; i <= finalPageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Page ${i} of ${finalPageCount}`,
        doc.internal.pageSize.getWidth() - 20,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'right' }
      );
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
  const logoWidth = 35;
  const logoHeight = 22;
  const logoX = 15;
  const headerY = 10;

  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', logoX, headerY, logoWidth, logoHeight);
  }

  // Company details - right of logo, compact spacing
  const detailsX = 55;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('KAPILLA GROUP LIMITED', detailsX, headerY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text('P.O Box 71729, Sea Cliff Village, 10 Toure Drive, Msasani', detailsX, headerY + 10);
  doc.text('Dar es Salaam, Tanzania', detailsX, headerY + 15);
  doc.text('Tel: +255 65 860 4772 / +255 76 062 9563', detailsX, headerY + 20);
  doc.text('Email: info@kapillagroup.co.tz  |  TIN: 157-935-380', detailsX, headerY + 25);

  // Separator line - below all header content
  const separatorY = headerY + logoHeight + 8;
  doc.setDrawColor(37, 99, 235);
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

  // Signature sections - THREE PEOPLE: Inspection, User, and Receiver
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tableEndY = (doc as any).lastAutoTable.finalY;
  
  // Check if we need a new page for signatures
  const signHeight = 110; // Total height for all signature blocks
  if (tableEndY + signHeight > 280) {
    doc.addPage();
    yPos = 20;
  } else {
    yPos = tableEndY + 12;
  }

  const blockWidth = 180;
  const blockHeight = 30;
  const textX = 20;

  // 1. INSPECTION SECTION
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12); // orange-600
  doc.text('1. INSPECTION / VERIFICATION:', 15, yPos);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(15, yPos + 2, blockWidth, blockHeight, 1, 1, 'D');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('Inspector Name: _________________________________', textX, yPos + 10);
  doc.text('Signature / Date: _______________________________', textX, yPos + 18);
  doc.text('Remarks: _______________________________________________', textX, yPos + 26);

  yPos += blockHeight + 10;

  // 2. USER SECTION
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(37, 99, 235); // blue-600
  doc.text('2. USER OF DELIVERED ITEM:', 15, yPos);

  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(15, yPos + 2, blockWidth, blockHeight, 1, 1, 'D');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('User Name / Dept: _______________________________', textX, yPos + 10);
  doc.text('Signature / Date: _______________________________', textX, yPos + 18);
  doc.text('Confirmation: I confirm receipt and usage of items listed above.', textX, yPos + 26);

  yPos += blockHeight + 10;

  // 3. RECEIVER SECTION
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(16, 185, 129); // green-500
  doc.text('3. RECEIVED BY (Store / Final Recipient):', 15, yPos);

  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(15, yPos + 2, blockWidth, blockHeight, 1, 1, 'D');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('Receiver Name: __________________________________', textX, yPos + 10);
  doc.text('Signature / Date: _______________________________', textX, yPos + 18);
  doc.text('Time: _______________', textX, yPos + 26);

  // Footer line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(15, 285, 195, 285);

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="delivery-note-${invoice.invoiceNumber}.pdf"`,
    },
  });
}
