import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ waybill: string }> }
) {
  try {
    const { waybill } = await params;

    const shipment = await db.shipment.findUnique({
      where: { waybillNumber: waybill },
      include: {
        events: {
          orderBy: {
            timestamp: 'desc'
          }
        },
        trips: {
          include: {
            checkIns: {
              orderBy: {
                timestamp: 'desc'
              },
              take: 1
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (!shipment) {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json(shipment);
  } catch (error) {
    console.error('[GET_SHIPMENT]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ waybill: string }> }
) {
  try {
    const { waybill } = await params;

    // Find the shipment first to get its ID (needed for relation deletion)
    const shipment = await db.shipment.findUnique({
      where: { waybillNumber: waybill },
      select: { id: true }
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // Delete related events first, then the shipment (transactional)
    await db.$transaction([
      db.trackingEvent.deleteMany({
        where: { shipmentId: shipment.id }
      }),
      db.checkIn.deleteMany({
        where: {
          trip: {
            shipmentId: shipment.id
          }
        }
      }),
      db.trip.deleteMany({
        where: { shipmentId: shipment.id }
      }),
      db.shipment.delete({
        where: { waybillNumber: waybill }
      })
    ]);

    return NextResponse.json({ message: 'Shipment deleted' });
  } catch (error) {
    console.error('[DELETE_SHIPMENT]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
