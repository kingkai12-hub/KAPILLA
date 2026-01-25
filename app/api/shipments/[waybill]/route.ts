import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: { waybill: string } }
) {
  try {
    const waybill = params.waybill;

    const shipment = await db.shipment.findUnique({
      where: { waybillNumber: waybill },
      include: {
        events: {
          orderBy: {
            timestamp: 'desc'
          }
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
  { params }: { params: { waybill: string } }
) {
  try {
    const waybill = params.waybill;

    await db.shipment.delete({
      where: { waybillNumber: waybill }
    });

    return NextResponse.json({ message: 'Shipment deleted' });
  } catch (error) {
    console.error('[DELETE_SHIPMENT]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
