import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
      origin, destination, weight, price
    } = body;

    // Generate unique waybill (Simple random for demo)
    const waybillNumber = 'KPL-' + Math.floor(10000 + Math.random() * 90000);

    const shipment = await db.shipment.create({
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
        currentStatus: 'PENDING',
        events: {
          create: {
            status: 'PENDING',
            location: origin,
            remarks: 'Shipment created'
          }
        }
      }
    });

    return NextResponse.json(shipment, { status: 201 });
  } catch (error) {
    console.error('[SHIPMENTS_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
