import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { waybillNumber, status, location, remarks, signature } = body;

    if (!waybillNumber || !status || !location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find shipment first to get ID
    const shipment = await db.shipment.findUnique({
      where: { waybillNumber }
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // Prepare update data
    const shipmentUpdateData: any = { currentStatus: status };
    if (status === 'DELIVERED' && signature) {
      shipmentUpdateData.receiverSignature = signature;
    }

    // Create tracking event AND update current status
    const result = await db.$transaction([
      db.trackingEvent.create({
        data: {
          shipmentId: shipment.id,
          status,
          location,
          remarks
        }
      }),
      db.shipment.update({
        where: { id: shipment.id },
        data: shipmentUpdateData
      })
    ]);

    return NextResponse.json(result[0]); // Return the created event
  } catch (error) {
    console.error('[TRACKING_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
