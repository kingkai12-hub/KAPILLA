import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const trip = await db.trip.findUnique({
      where: { id },
      include: {
        driver: { select: { name: true } }, 
        shipment: { select: { waybillNumber: true } },
        checkIns: {
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    return NextResponse.json(trip);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch trip' }, { status: 500 });
  }
}
