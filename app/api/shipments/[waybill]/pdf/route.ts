import { NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';

async function getDb() {
  const { db } = await import('@/lib/db');
  return db;
}

export async function GET(
  req: Request,
  context: { params: Promise<{ waybill: string }> | { waybill: string } }
) {
  try {
    const params = await Promise.resolve(context.params);
    const db = await getDb();

    const shipment = await db.shipment.findUnique({
      where: { waybillNumber: params.waybill },
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // Create PDF
    const doc = new jsPDF();

    // Generate QR Code
    const qrDataUrl = await QRCode.toDataURL(
      `https://kapillagroup.vercel.app/waybill/${encodeURIComponent(shipment.waybillNumber)}`,
      { width: 80, margin: 1 }
    );

    // Modern Professional Header Design
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 38, 'F');

    // Company name and details on LEFT
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('KAPILLA GROUP LIMITED', 15, 14);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text('P.O Box 71729', 15, 20);
    doc.text('Sea Cliff Village, 10 Toure Drive, Msasani', 15, 24);
    doc.text('Dar es Salaam, Tanzania', 15, 28);
    doc.text('Tel: +255 766 724 062 | +255 756 656 218', 15, 32);
    doc.text('Email: express@kapillagroup.co.tz', 15, 32);

    // Logo in CENTER
    try {
      const logoUrl = 'https://kapillagroup.vercel.app/kapila%20logo.png';
      const logoResponse = await fetch(logoUrl);
      if (logoResponse.ok) {
        const logoBlob = await logoResponse.arrayBuffer();
        const logoBase64 = Buffer.from(logoBlob).toString('base64');
        doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', 87.5, 10, 35, 22);
      }
    } catch (error) {
      console.log('Logo not added:', error);
    }

    // Waybill Number Box on RIGHT - Modern design
    doc.setDrawColor(25, 55, 109); // Dark blue
    doc.setLineWidth(1);
    doc.rect(160, 8, 40, 24);

    doc.setTextColor(25, 55, 109);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('WAYBILL NO.', 180, 13, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(shipment.waybillNumber, 180, 20, { align: 'center' });

    doc.setFontSize(7);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(shipment.createdAt).toLocaleDateString(), 180, 27, { align: 'center' });

    // Dark Blue Separator Line
    doc.setDrawColor(25, 55, 109);
    doc.setLineWidth(1.5);
    doc.line(15, 38, 195, 38);

    let yPos = 45;

    // Modern Route Section with clean borders - matching light boxes
    // Origin box
    doc.setDrawColor(25, 55, 109);
    doc.setLineWidth(0.8);
    doc.setFillColor(250, 251, 252); // Light gray-blue background
    doc.rect(15, yPos, 85, 18, 'FD');
    doc.setTextColor(25, 55, 109);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('ORIGIN', 17, yPos + 5);
    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.text(shipment.origin.toUpperCase(), 17, yPos + 13);

    // Destination box - same style as origin
    doc.setDrawColor(25, 55, 109);
    doc.setLineWidth(0.8);
    doc.setFillColor(250, 251, 252); // Same light gray-blue background
    doc.rect(105, yPos, 85, 18, 'FD');
    doc.setTextColor(25, 55, 109);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('DESTINATION', 107, yPos + 5);
    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.text(shipment.destination.toUpperCase(), 107, yPos + 13);

    yPos += 23;

    // Sender and Receiver - Modern clean boxes
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.5);
    doc.rect(15, yPos, 85, 32);
    doc.rect(105, yPos, 85, 32);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(25, 55, 109);
    doc.text('FROM (SENDER)', 17, yPos + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(shipment.senderName, 17, yPos + 12);
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text(shipment.senderPhone, 17, yPos + 17);
    doc.text(shipment.senderAddress || '', 17, yPos + 22, { maxWidth: 80 });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(25, 55, 109);
    doc.text('TO (RECEIVER)', 107, yPos + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(shipment.receiverName, 107, yPos + 12);
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text(shipment.receiverPhone, 107, yPos + 17);
    doc.text(shipment.receiverAddress || '', 107, yPos + 22, { maxWidth: 80 });

    yPos += 37;

    // Modern Shipment Details Table with light header
    autoTable(doc, {
      startY: yPos,
      head: [['Type', 'Weight', 'Service']],
      body: [[shipment.type || 'Standard', `${shipment.weight || 0} kg`, 'Standard Delivery']],
      theme: 'plain',
      headStyles: {
        fillColor: [220, 230, 240], // Light blue-gray instead of dark blue
        textColor: [25, 55, 109], // Dark blue text
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 9,
        halign: 'center',
        textColor: [0, 0, 0],
      },
      alternateRowStyles: {
        fillColor: [250, 251, 252],
      },
      margin: { left: 15, right: 15 },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    yPos = (doc as any).lastAutoTable.finalY + 8;

    // Cargo Details Section - Single box with header and details
    if (shipment.cargoDetails && shipment.cargoDetails.trim() !== '') {
      // Calculate height needed for cargo text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      const cargoText = doc.splitTextToSize(shipment.cargoDetails, 172);
      const cargoHeight = 8 + cargoText.length * 5 + 6; // Header + text + padding

      // Draw single bordered box for entire section
      doc.setDrawColor(25, 55, 109);
      doc.setLineWidth(0.8);
      doc.setFillColor(250, 251, 252);
      doc.rect(15, yPos, 180, cargoHeight, 'FD');

      // Add "CARGO DETAILS" label at top
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(25, 55, 109);
      doc.text('CARGO DETAILS:', 17, yPos + 6);

      // Add actual cargo details in RED BOLD below the label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(200, 0, 0); // Red color
      doc.text(cargoText, 17, yPos + 12);

      yPos += cargoHeight + 8;
    }

    // Dispatcher and Receiver Sections - Modern design
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.5);
    doc.rect(15, yPos, 85, 36);
    doc.rect(105, yPos, 85, 36);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(25, 55, 109);
    doc.text('DISPATCHED BY', 17, yPos + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(`Name: ${shipment.dispatcherName || '_______________'}`, 17, yPos + 12);
    doc.text(`Sign: ${shipment.dispatcherSignature || '_______________'}`, 17, yPos + 18);
    doc.text(`Date: ${new Date(shipment.createdAt).toLocaleString()}`, 17, yPos + 24);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(25, 55, 109);
    doc.text('RECEIVED BY', 107, yPos + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(`Name: ${shipment.receivedBy || '_______________'}`, 107, yPos + 12);
    doc.text('ID No: _______________', 107, yPos + 18);

    // Show signature if delivered
    if (shipment.receiverSignature) {
      doc.text('Signature:', 107, yPos + 24);
      try {
        doc.addImage(shipment.receiverSignature, 'PNG', 107, yPos + 26, 30, 8);
      } catch {
        doc.text('Signature: [Signed]', 107, yPos + 24);
      }
    } else {
      doc.text('Signature: _______________', 107, yPos + 24);
    }

    if (shipment.deliveredAt) {
      doc.text(`Date: ${new Date(shipment.deliveredAt).toLocaleDateString()}`, 107, yPos + 30);
    }

    yPos += 42;

    // Modern Footer Section
    doc.setDrawColor(25, 55, 109);
    doc.setLineWidth(0.5);
    doc.line(15, yPos, 195, yPos);
    yPos += 6;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(25, 55, 109);
    doc.text('TERMS AND CONDITIONS OF CARRIAGE', 105, yPos, { align: 'center' });
    yPos += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(60, 60, 60);
    const terms = [
      '1. Kapilla Group Limited accepts goods for carriage subject to the conditions herein.',
      '2. The Carrier shall not be liable for any loss or damage unless proven to be caused by negligence.',
      '3. Liability is limited to the declared value or maximum policy limit, whichever is lower.',
      '4. Claims must be notified in writing within 7 days of delivery.',
      '5. This waybill constitutes the entire agreement between the parties.',
    ];

    terms.forEach((term) => {
      const lines = doc.splitTextToSize(term, 180);
      doc.text(lines, 15, yPos);
      yPos += lines.length * 3.5;
    });

    yPos += 4;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(25, 55, 109);
    doc.text('THANK YOU FOR CHOOSING KAPILLA GROUP LIMITED', 105, yPos, { align: 'center' });

    // QR Code at the bottom center
    yPos += 6;
    doc.addImage(qrDataUrl, 'PNG', 95, yPos, 20, 20);

    // Generate PDF
    const pdfBuffer = doc.output('arraybuffer');

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Waybill-${shipment.waybillNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[WAYBILL_PDF]', error);
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
