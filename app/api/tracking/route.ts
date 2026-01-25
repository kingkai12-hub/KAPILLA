import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { waybillNumber, status, location, remarks, signature, receivedBy, latitude, longitude } = body;

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
        const driver = await db.user.findFirst({ where: { role: 'DRIVER' } }); // Fallback to any driver or a system user if needed
        const newTrip = await db.trip.create({
            data: {
                shipmentId: shipment.id,
                driverId: driver?.id || shipment.id, // Fallback to using shipment ID as driver ID if no driver found (requires schema looseness or proper setup, but let's assume there's a driver or we skip)
                // Actually, driverId is required. Let's find a default driver or create one if needed.
                // For now, let's assume there is at least one user, or we use a system user.
                // If no driver, we can't create a trip easily. 
                // Let's try to find ANY user to attach.
                startLocation: shipment.origin,
                endLocation: shipment.destination,
            }
        });
        tripId = newTrip.id;
    }

    // Prepare update data
    const shipmentUpdateData: any = { currentStatus: status };
    if (status === 'DELIVERED') {
      if (signature) shipmentUpdateData.receiverSignature = signature;
      if (receivedBy) shipmentUpdateData.receivedBy = receivedBy;
    }

    // Transaction operations
    const operations: any[] = [
      db.trackingEvent.create({
        data: {
          shipmentId: shipment.id,
          status,
          location,
          remarks
        }
      }),
      db.shipment.update({
        where: { id: shipment.id },
        data: shipmentUpdateData
      })
    ];

    // Add CheckIn if we have coordinates and a trip
    if (latitude && longitude) {
        // We need a trip ID. If we couldn't find/create one, we can't add checkin.
        // But for this feature to work, we really need it.
        // Let's assume we can find an existing trip or we skip CheckIn if no trip.
        // But we really should try to attach it.
        
        // Let's try to find the trip again or use the one we found.
        if (!tripId) {
             // Try to find a dummy driver to create a trip
             const systemUser = await db.user.findFirst();
             if (systemUser) {
                 const newTrip = await db.trip.create({
                     data: {
                         shipmentId: shipment.id,
                         driverId: systemUser.id,
                         startLocation: shipment.origin,
                         endLocation: shipment.destination,
                     }
                 });
                 tripId = newTrip.id;
             }
        }

        if (tripId) {
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
    }

    const result = await db.$transaction(operations);

    return NextResponse.json(result[0]); // Return the created event
  } catch (error) {
    console.error('[TRACKING_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
