import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { locationCoords } from '@/lib/locations';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const waybillNumber = searchParams.get('waybillNumber');

  if (!waybillNumber) {
    return NextResponse.json({ error: 'Waybill number is required' }, { status: 400 });
  }

  try {
    const normalized = waybillNumber.trim();
    const shipment = await db.shipment.findFirst({
      where: { waybillNumber: { equals: normalized, mode: 'insensitive' } }
    });
    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    let tracking = await db.vehicleTracking.findUnique({
      where: { shipmentId: shipment.id },
      include: { segments: { orderBy: { order: 'asc' } } }
    });

    // If no tracking exists, create a simulated one for demonstration
    if (!tracking) {
      const startCoords = locationCoords[shipment.origin as keyof typeof locationCoords] || { lat: -6.7924, lng: 39.2083 };
      const endCoords = locationCoords[shipment.destination as keyof typeof locationCoords] || { lat: -2.5164, lng: 32.9033 };

      // Simplified straight line for initial segments (In a real app, OSRM would provide road points)
      const numSegments = 50;
      const segmentsData = [];
      for (let i = 0; i < numSegments; i++) {
        const sLat = startCoords.lat + (endCoords.lat - startCoords.lat) * (i / numSegments);
        const sLng = startCoords.lng + (endCoords.lng - startCoords.lng) * (i / numSegments);
        const eLat = startCoords.lat + (endCoords.lat - startCoords.lat) * ((i + 1) / numSegments);
        const eLng = startCoords.lng + (endCoords.lng - startCoords.lng) * ((i + 1) / numSegments);
        
        segmentsData.push({
          startLat: sLat,
          startLng: sLng,
          endLat: eLat,
          endLng: eLng,
          isCompleted: false,
          order: i
        });
      }

      tracking = await db.vehicleTracking.create({
        data: {
          shipmentId: shipment.id,
          currentLat: startCoords.lat,
          currentLng: startCoords.lng,
          speed: 45,
          heading: 0,
          segments: {
            create: segmentsData
          }
        },
        include: { segments: { orderBy: { order: 'asc' } } }
      });
    }

    return NextResponse.json(tracking);
  } catch (error) {
    console.error('[TRACKING_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
