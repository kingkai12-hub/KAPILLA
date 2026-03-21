import { NextResponse } from 'next/server';
import jsPDF from 'jspdf';
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

    if (shipment.currentStatus !== 'DELIVERED') {
      return NextResponse.json(
        { error: 'POD can only be generated for delivered shipments' },
        { status: 400 }
      );
    }

    // Create PDF
    const doc = new jsPDF();

    // Generate QR Code
    const qrDataUrl = await QRCode.toDataURL(
      `https://kapillagroup.vercel.app/waybill/${encodeURIComponent(shipment.waybillNumber)}`,
      { width: 60, margin: 1 }
    );

    // Header
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.line(15, 35, 195, 35);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('KAPILLA GROUP LIMITED', 15, 15);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('P.O Box 71729', 15, 21);
    doc.text('Sea Cliff Village, 10 Toure Drive, Msasani', 15, 26);
    doc.text('Dar es Salaam, Tanzania', 15, 31);
    doc.text('Tel: +255 756 656 218 / +255 766 724 062', 15, 36);
    doc.text('Email: express@kapillagroup.co.tz', 15, 41);

    // POD Title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('PROOF OF DELIVERY', 195, 20, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`REF: ${shipment.waybillNumber}`, 195, 28, { align: 'right' });

    // Status Banner
    let yPos = 45;
    doc.setFillColor(220, 252, 231);
    doc.rect(15, yPos, 180, 15, 'F');
    doc.setDrawColor(134, 239, 172);
    doc.rect(15, yPos, 180, 15);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52);
    doc.text('Shipment Delivered Successfully', 20, yPos + 6);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Confirmed on ${new Date(shipment.deliveredAt || shipment.updatedAt).toLocaleString()}`,
      20,
      yPos + 12
    );

    yPos += 25;
    doc.setTextColor(0, 0, 0);

    // Sender and Receiver Info
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('SENDER INFORMATION', 15, yPos);
    doc.text('RECEIVER INFORMATION', 110, yPos);

    doc.setDrawColor(200, 200, 200);
    doc.line(15, yPos + 2, 90, yPos + 2);
    doc.line(110, yPos + 2, 195, yPos + 2);

    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(shipment.senderName, 15, yPos);
    doc.text(shipment.receiverName, 110, yPos);

    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(shipment.senderPhone, 15, yPos);
    doc.text(shipment.receiverPhone, 110, yPos);

    yPos += 5;
    doc.text(shipment.senderAddress || 'N/A', 15, yPos, { maxWidth: 85 });
    doc.text(shipment.receiverAddress || 'N/A', 110, yPos, { maxWidth: 85 });

    yPos += 8;
    doc.setFontSize(8);
    doc.text(`Origin: ${shipment.origin}`, 15, yPos);
    doc.text(`Destination: ${shipment.destination}`, 110, yPos);

    yPos += 15;

    // Shipment Details
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('SHIPMENT DETAILS', 15, yPos);
    doc.setDrawColor(200, 200, 200);
    doc.line(15, yPos + 2, 195, yPos + 2);

    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const details = [
      ['Waybill Number:', shipment.waybillNumber],
      ['Type:', shipment.type || 'Standard'],
      ['Weight:', `${shipment.weight || 0} kg`],
      ['Cargo Details:', shipment.cargoDetails || 'N/A'],
      ['Dispatch Date:', new Date(shipment.createdAt).toLocaleString()],
      ['Delivery Date:', new Date(shipment.deliveredAt || shipment.updatedAt).toLocaleString()],
    ];

    details.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 15, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 60, yPos);
      yPos += 6;
    });

    yPos += 5;

    // Delivery Confirmation
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('DELIVERY CONFIRMATION', 15, yPos);
    doc.setDrawColor(200, 200, 200);
    doc.line(15, yPos + 2, 195, yPos + 2);

    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.text(`Received By: ${shipment.receivedBy || 'N/A'}`, 15, yPos);
    yPos += 8;

    // Signature section
    doc.text('Signature:', 15, yPos);
    yPos += 3;
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.5);
    doc.rect(15, yPos, 60, 20);

    if (shipment.receiverSignature) {
      doc.setFontSize(8);
      doc.text('(Signature on file)', 45, yPos + 10, { align: 'center' });
    } else {
      doc.setFontSize(8);
      doc.text('(Signature)', 45, yPos + 10, { align: 'center' });
    }
    yPos += 25;

    // QR Code
    doc.addImage(qrDataUrl, 'PNG', 160, yPos - 30, 30, 30);
    doc.setFontSize(7);
    doc.text('Scan to verify', 175, yPos - 30 + 33, { align: 'center' });

    // Footer
    yPos = 270;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(15, yPos, 195, yPos);

    yPos += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('THANK YOU FOR CHOOSING KAPILLA GROUP LIMITED', 105, yPos, { align: 'center' });

    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(
      'This is a computer-generated document and serves as proof of successful delivery.',
      105,
      yPos,
      { align: 'center' }
    );

    // Generate PDF
    const pdfBuffer = doc.output('arraybuffer');

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="POD-${shipment.waybillNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[POD_PDF]', error);
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
