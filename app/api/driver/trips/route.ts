import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const trips = await db.trip.findMany({
      where: { status: 'ACTIVE' },
      include: {
        driver: { select: { name: true } },
        shipment: { select: { waybillNumber: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(trips);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { driverId, shipmentId, startLocation, endLocation } = body;

    const trip = await db.trip.create({
      data: {
        driverId,
        shipmentId,
        startLocation,
        endLocation,
        status: 'ACTIVE'
      }
    });

    return NextResponse.json(trip, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 });
  }
}
