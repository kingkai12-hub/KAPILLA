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
    
    // Use the lowercase model names directly as verified in debug-db.js
    const shipmentModel = (db as any).shipment;
    const vehicleTrackingModel = (db as any).vehicleTracking;
    const routeSegmentModel = (db as any).routeSegment;

    if (!shipmentModel || !vehicleTrackingModel) {
      return NextResponse.json({ error: 'Database models not initialized' }, { status: 500 });
    }

    const shipment = await shipmentModel.findFirst({
      where: { waybillNumber: { equals: normalized, mode: 'insensitive' } }
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    let tracking = await vehicleTrackingModel.findUnique({
      where: { shipmentId: shipment.id },
      include: { segments: { orderBy: { order: 'asc' } } }
    });

    // If no tracking exists, or it has no segments, create segments for demonstration
    if (!tracking || !tracking.segments || tracking.segments.length === 0) {
      const startCoords = getLocationCoords(shipment.origin) || { lat: -6.7924, lng: 39.2083 };
      const endCoords = getLocationCoords(shipment.destination) || { lat: -2.5164, lng: 32.9033 };

      console.log(`[TRACKING] Generating simulation route for ${waybillNumber}`);

      const numSegments = 100;
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

      if (!tracking) {
        tracking = await vehicleTrackingModel.create({
          data: {
            shipmentId: shipment.id,
            currentLat: startCoords.lat,
            currentLng: startCoords.lng,
            speed: 35,
            heading: 0,
            segments: { create: segmentsData }
          },
          include: { segments: { orderBy: { order: 'asc' } } }
        });
      } else {
        await vehicleTrackingModel.update({
          where: { id: tracking.id },
          data: { segments: { create: segmentsData } }
        });
        tracking = await vehicleTrackingModel.findUnique({
          where: { id: tracking.id },
          include: { segments: { orderBy: { order: 'asc' } } }
        });
      }
    }

    // MOVEMENT LOGIC
    if (tracking && tracking.segments && tracking.segments.length > 0) {
      const incompleteSegments = tracking.segments.filter((s: any) => !s.isCompleted);
      
      // Reset if finished
      if (incompleteSegments.length === 0) {
        await routeSegmentModel.updateMany({
          where: { trackingId: tracking.id },
          data: { isCompleted: false }
        });
        tracking = await vehicleTrackingModel.update({
          where: { id: tracking.id },
          data: {
            currentLat: tracking.segments[0].startLat,
            currentLng: tracking.segments[0].startLng,
            speed: 35,
            lastUpdated: new Date()
          },
          include: { segments: { orderBy: { order: 'asc' } } }
        });
      } else {
        const nextSegment = incompleteSegments[0];
        
        // Calculate heading
        const dy = nextSegment.endLat - tracking.currentLat;
        const dx = nextSegment.endLng - tracking.currentLng;
        const heading = (Math.atan2(dx, dy) * 180) / Math.PI;

        // Progress based speed
        const progress = (tracking.segments.length - incompleteSegments.length) / tracking.segments.length;
        const isUrban = progress < 0.2 || progress > 0.8;
        const baseSpeed = isUrban ? 40 : 100;
        const targetSpeed = baseSpeed + (Math.random() * 10 - 5);

        // Move vehicle - INCREASED step size significantly for visibility
        const stepSize = targetSpeed * 0.00005; // 5x faster than before
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        let newLat = tracking.currentLat;
        let newLng = tracking.currentLng;
        
        if (dist > 0) {
          newLat += (dy / dist) * stepSize;
          newLng += (dx / dist) * stepSize;
        }

        const distanceToEnd = Math.sqrt(Math.pow(nextSegment.endLat - newLat, 2) + Math.pow(nextSegment.endLng - newLng, 2));
        
        const updateData: any = {
          currentLat: newLat,
          currentLng: newLng,
          speed: targetSpeed,
          heading: heading,
          lastUpdated: new Date()
        };

        if (distanceToEnd < 0.005) { // Increased threshold for smoother segment completion
          await routeSegmentModel.update({
            where: { id: nextSegment.id },
            data: { isCompleted: true }
          });
        }

        tracking = await vehicleTrackingModel.update({
          where: { id: tracking.id },
          data: updateData,
          include: { segments: { orderBy: { order: 'asc' } } }
        });
      }
    }

    return NextResponse.json({
      ...tracking,
      isSimulated: true,
      serverTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('[TRACKING_GET]', error);
    const message = (error as any)?.message || 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      waybillNumber, 
      status, 
      location, 
      remarks, 
      estimatedDelivery, 
      estimatedDeliveryTime,
      transportType 
    } = body;

    const shipment = await db.shipment.findUnique({
      where: { waybillNumber: waybillNumber },
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // Update shipment status if it's not DELIVERED
    if (shipment.currentStatus !== 'DELIVERED') {
      await db.shipment.update({
        where: { id: shipment.id },
        data: { 
          currentStatus: status,
          // Update estimated delivery if provided
          ...(estimatedDelivery && { 
            // We might need to add these fields to the schema if they don't exist
            // For now, let's assume they are handled by the events
          })
        }
      });
    }

    // Create tracking event
    const event = await db.trackingEvent.create({
      data: {
        shipmentId: shipment.id,
        status: status,
        location: location || 'Unknown',
        remarks: remarks || `Shipment is ${status.toLowerCase().replace('_', ' ')}`,
        timestamp: new Date()
      }
    });

    // Update vehicle tracking position if location is recognized
    if (location) {
      const coords = getLocationCoords(location);
      if (coords) {
        const vehicleTrackingModel = (db as any).VehicleTracking || (db as any).vehicleTracking;
        if (vehicleTrackingModel) {
          await vehicleTrackingModel.upsert({
            where: { shipmentId: shipment.id },
            update: {
              currentLat: coords.lat,
              currentLng: coords.lng,
              lastUpdated: new Date()
            },
            create: {
              shipmentId: shipment.id,
              currentLat: coords.lat,
              currentLng: coords.lng,
              speed: 0,
              heading: 0,
              lastUpdated: new Date()
            }
          });
          console.log(`[TRACKING_POST] Updated vehicle position for ${waybillNumber} to ${location} (${coords.lat}, ${coords.lng})`);
        }
      }
    }

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('[TRACKING_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
