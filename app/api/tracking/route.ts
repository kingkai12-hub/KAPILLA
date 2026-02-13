import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { locationCoords, getLocationCoords } from '@/lib/locations';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const waybillNumber = searchParams.get('waybillNumber');

  if (!waybillNumber) {
    return NextResponse.json({ error: 'Waybill number is required' }, { status: 400 });
  }

  try {
    const normalized = waybillNumber.trim();
    // Extremely defensive model access to handle both schema @map and runtime property names
    const shipmentModel = (db as any).Shipment || (db as any).shipment;
    const vehicleTrackingModel = (db as any).VehicleTracking || (db as any).vehicleTracking;
    const routeSegmentModel = (db as any).RouteSegment || (db as any).routeSegment;

    if (!shipmentModel) {
      console.error('CRITICAL: Shipment model not found in DB client.', {
        availableModels: Object.keys(db).filter(k => !k.startsWith('$'))
      });
      return NextResponse.json({ 
        error: 'Database configuration error.',
        details: 'Shipment model missing. Available: ' + Object.keys(db).filter(k => !k.startsWith('$')).join(', ')
      }, { status: 500 });
    }

    const shipment = await shipmentModel.findFirst({
      where: { waybillNumber: { equals: normalized, mode: 'insensitive' } }
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    let tracking = null;
    if (vehicleTrackingModel) {
      tracking = await vehicleTrackingModel.findUnique({
        where: { shipmentId: shipment.id },
        include: { segments: { orderBy: { order: 'asc' } } }
      });
    }

    // If no tracking exists, create a simulated one for demonstration
    if (!tracking && vehicleTrackingModel && routeSegmentModel) {
      const startCoords = getLocationCoords(shipment.origin) || { lat: -6.7924, lng: 39.2083 };
      const endCoords = getLocationCoords(shipment.destination) || { lat: -2.5164, lng: 32.9033 };

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

      tracking = await vehicleTrackingModel.create({
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

    if (tracking) {
      return NextResponse.json(tracking);
    }

    // FINAL FALLBACK: If tracking model is missing but shipment exists, 
    // we return a basic tracking object so the map doesn't show "Database configuration error"
    // This allows the app to function even if Prisma generation is slightly off
    const startCoords = getLocationCoords(shipment.origin) || { lat: -6.7924, lng: 39.2083 };
    return NextResponse.json({
      currentLat: startCoords.lat,
      currentLng: startCoords.lng,
      speed: 0,
      heading: 0,
      segments: []
    });
  } catch (error) {
    console.error('[TRACKING_GET]', error);
    const message = (error as any)?.message || 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
