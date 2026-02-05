import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendShipmentCreatedSMS } from '@/lib/sms';
import { revalidatePath } from 'next/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const shipments = await db.shipment.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    return NextResponse.json(shipments);
  } catch (error) {
    console.error('[SHIPMENTS_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      senderName, senderPhone, senderAddress,
      receiverName, receiverPhone, receiverAddress,
      origin, destination, weight, price, type, cargoDetails,
      dispatcherName, dispatcherSignature
    } = body;

    async function nextWaybill() {
      const now = new Date();
      const yy = String(now.getFullYear());
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const prefix = `KPL-${yy}${mm}`;
      const latest = await db.shipment.findFirst({
        where: { waybillNumber: { startsWith: prefix } },
        orderBy: { waybillNumber: 'desc' },
        select: { waybillNumber: true }
      });
      let n = 1;
      if (latest?.waybillNumber?.startsWith(prefix)) {
        const s = latest.waybillNumber.slice(prefix.length);
        const v = parseInt(s, 10);
        if (!Number.isNaN(v)) n = v + 1;
      }
      return `${prefix}${String(n).padStart(2, '0')}`;
    }

    let waybillNumber = await nextWaybill();
    let shipment: any = null;
    for (let i = 0; i < 3; i++) {
      try {
        shipment = await db.shipment.create({
          data: {
            waybillNumber,
            senderName,
            senderPhone,
            senderAddress,
            receiverName,
            receiverPhone,
            receiverAddress,
            origin,
            destination,
            weight: weight ? parseFloat(weight) : null,
            price: price ? parseFloat(price) : null,
            cargoDetails,
            currentStatus: 'PENDING',
            dispatcherName,
            dispatcherSignature,
            events: {
              create: {
                status: 'PENDING',
                location: origin,
                remarks: 'Shipment created'
              }
            }
          }
        });
        break;
      } catch (e: any) {
        if (e?.code === 'P2002') {
          const now = new Date();
          const yy = String(now.getFullYear());
          const mm = String(now.getMonth() + 1).padStart(2, '0');
          const prefix = `KPL-${yy}${mm}`;
          const numeric = waybillNumber.slice(prefix.length);
          const v = parseInt(numeric, 10);
          const next = Number.isNaN(v) ? 1 : v + 1;
          waybillNumber = `${prefix}${String(next).padStart(2, '0')}`;
          continue;
        }
        throw e;
      }
    }

    if (!shipment) {
      return NextResponse.json({ error: 'Failed to create shipment' }, { status: 500 });
    }

    // Send SMS notification if sender phone is provided
    if (senderPhone) {
      await sendShipmentCreatedSMS(
        senderPhone,
        waybillNumber,
        senderName,
        destination
      );
    }

    revalidatePath('/staff/dashboard');
    revalidatePath('/staff/shipments');

    return NextResponse.json(shipment, { status: 201 });
  } catch (error) {
    console.error('[SHIPMENTS_POST] Error:', error);
    // Return the actual error message for debugging (in development)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
