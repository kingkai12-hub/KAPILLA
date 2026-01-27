import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { waybillNumber, status, location, remarks, signature, receivedBy, latitude, longitude, estimatedDelivery, estimatedDeliveryTime, transportType } = body;

    if (!waybillNumber || !status || !location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find shipment first to get ID
    const shipment = await db.shipment.findUnique({
      where: { waybillNumber },
      include: { trips: true }
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // Handle CheckIn creation if coordinates are provided
    let tripId = shipment.trips[0]?.id;

    if ((latitude && longitude) && !tripId) {
        // Create a default trip if none exists
        // Fallback to any driver or a system user if needed
        const driver = await db.user.findFirst({ where: { role: 'DRIVER' } }); 
        const systemUser = await db.user.findFirst();
        
        // Use driver ID if available, otherwise use system user ID, otherwise fail gracefully (or use shipment.senderId if appropriate, but stick to User IDs)
        const driverId = driver?.id || systemUser?.id;

        if (driverId) {
             const newTrip = await db.trip.create({
                data: {
                    shipmentId: shipment.id,
                    driverId: driverId,
                    startLocation: shipment.origin,
                    endLocation: shipment.destination,
                }
            });
            tripId = newTrip.id;
        }
    }

    // Prepare update data
    // We NO LONGER update the shipment status here based on user request.
    // "only update of cargo stuatus can be made in a shipment and not in atracking"
    
    // EXCEPTION: If the shipment is currently PENDING, a tracking update means it has started moving.
    // So we auto-transition it to IN_TRANSIT to avoid it being "stuck" in PENDING on the map.
    // We add this to the transaction operations to ensure consistency.

    // Transaction operations
    const composedRemarks = (() => {
      const parts = [remarks?.trim()].filter(Boolean);
      if (estimatedDelivery) {
        let eta = `ETA: ${estimatedDelivery}`;
        if (estimatedDeliveryTime) eta += ` ${estimatedDeliveryTime}`;
        parts.push(eta);
      }
      if (transportType) parts.push(`Mode: ${transportType}`);
      return parts.join(' | ');
    })();

    const operations: any[] = [
      db.trackingEvent.create({
        data: {
          shipmentId: shipment.id,
          status,
          location,
          remarks: composedRemarks
        }
      })
    ];

    if (shipment.currentStatus === 'PENDING') {
        operations.push(
            db.shipment.update({
                where: { id: shipment.id },
                data: { currentStatus: 'IN_TRANSIT' }
            })
        );
    }

    // Add CheckIn if we have coordinates and a trip
    if (latitude && longitude && tripId) {
        operations.push(
            db.checkIn.create({
                data: {
                    tripId,
                    location,
                    latitude,
                    longitude,
                    status: 'OK'
                }
            })
        );
    }

    const result = await db.$transaction(operations);

    return NextResponse.json(result[0]); // Return the created event
  } catch (error) {
    console.error('[TRACKING_POST_ERROR]', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
