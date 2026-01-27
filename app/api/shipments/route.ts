import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendShipmentCreatedEmail } from '@/lib/mail';

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

    // Send email notification if sender email is provided
    if (senderEmail) {
      await sendShipmentCreatedEmail(
        senderEmail,
        waybillNumber,
        senderName,
        receiverName,
        destination
      );
    }

    return NextResponse.json(shipment, { status: 201 });
  } catch (error) {
    console.error('[SHIPMENTS_POST] Error:', error);
    // Return the actual error message for debugging (in development)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
