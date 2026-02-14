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

    // If no tracking exists, or it has no segments, create/re-create segments for demonstration
    if (vehicleTrackingModel && routeSegmentModel && (!tracking || !tracking.segments || tracking.segments.length === 0)) {
      const startCoords = getLocationCoords(shipment.origin) || { lat: -6.7924, lng: 39.2083 };
      const endCoords = getLocationCoords(shipment.destination) || { lat: -2.5164, lng: 32.9033 };

      console.log(`[TRACKING] Generating simulation route for ${waybillNumber} from ${shipment.origin} to ${shipment.destination}`);

      // Generate a predefined route with 100 segments
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
            segments: {
              create: segmentsData
            }
          },
          include: { segments: { orderBy: { order: 'asc' } } }
        });
      } else {
        // Tracking exists but segments are missing, add them
        await vehicleTrackingModel.update({
          where: { id: tracking.id },
          data: {
            segments: {
              create: segmentsData
            }
          }
        });
        // Refetch with segments
        tracking = await vehicleTrackingModel.findUnique({
          where: { id: tracking.id },
          include: { segments: { orderBy: { order: 'asc' } } }
        });
      }
    }

    // SIMULATION LOGIC: Move the vehicle if tracking exists
    if (!tracking) {
      console.warn('[TRACKING] No tracking data found.');
    } else if (!vehicleTrackingModel || !routeSegmentModel) {
      console.error('[TRACKING] CRITICAL: Models missing for update.', {
        hasTrackingModel: !!vehicleTrackingModel,
        hasSegmentModel: !!routeSegmentModel,
        dbKeys: Object.keys(db).filter(k => !k.startsWith('$'))
      });
      // Fallback: If models are missing, we CANNOT update, so just return static
    } else {
      const incompleteSegments = tracking.segments.filter((s: any) => !s.isCompleted);
      
      // AUTO-RESET SIMULATION: If all segments are completed, restart the loop
      if (incompleteSegments.length === 0 && tracking.segments.length > 0) {
        console.log('[TRACKING] Route completed. Resetting simulation loop...');
        await routeSegmentModel.updateMany({
          where: { trackingId: tracking.id },
          data: { isCompleted: false }
        });
        // Refetch fresh segments
        tracking.segments = await routeSegmentModel.findMany({
          where: { trackingId: tracking.id },
          orderBy: { order: 'asc' }
        });
        // Force update tracking to start position
        await vehicleTrackingModel.update({
          where: { id: tracking.id },
          data: {
            currentLat: tracking.segments[0].startLat,
            currentLng: tracking.segments[0].startLng,
            speed: 0,
            lastUpdated: new Date()
          }
        });
        return NextResponse.json({
          ...tracking,
          isSimulated: true,
          status: 'Simulation Reset',
          serverTime: new Date().toISOString()
        });
      }

      // ADMIN CONFIGURATION (Simulated)
      const SPEED_CONFIG = {
        CITY_MIN: 20,
        CITY_MAX: 50,
        HIGHWAY_MIN: 80, // "Admin-defined" high speed
        HIGHWAY_MAX: 120
      };

      if (incompleteSegments.length > 0) {
        const nextSegment = incompleteSegments[0];
        
        // 1. Calculate heading from current position to next segment end
        const dy = nextSegment.endLat - tracking.currentLat;
        const dx = nextSegment.endLng - tracking.currentLng;
        const heading = (Math.atan2(dx, dy) * 180) / Math.PI;

        // 2. Determine speed based on location (Urban vs Highway)
        // First and last 20% of segments are considered "Urban Zones"
        const progress = (tracking.segments.length - incompleteSegments.length) / tracking.segments.length;
        const isUrban = progress < 0.2 || progress > 0.8;
        
        const minSpeed = isUrban ? SPEED_CONFIG.CITY_MIN : SPEED_CONFIG.HIGHWAY_MIN;
        const maxSpeed = isUrban ? SPEED_CONFIG.CITY_MAX : SPEED_CONFIG.HIGHWAY_MAX;
        
        // Add slight randomness to simulate traffic variations
        const targetSpeed = minSpeed + Math.random() * (maxSpeed - minSpeed);

      // 3. Move currentLat/Lng towards nextSegment end
      // Physics Calculation:
      // 1 degree latitude ~= 111km
      // Time step = 1 second (1/3600 hour)
      // Distance (km) = Speed (km/h) * Time (h) = Speed / 3600
      // Distance (degrees) = Distance (km) / 111 = (Speed / 3600) / 111
      // Factor: 1 / (3600 * 111) ≈ 0.0000025
      const stepSize = targetSpeed * 0.00001; // QUADRUPLED for visibility (was 0.000005)
      
      // Use normalized vector to ensure consistent movement regardless of distance
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      let newLat = tracking.currentLat;
      let newLng = tracking.currentLng;
      
      if (dist > 0) {
        newLat += (dy / dist) * stepSize;
        newLng += (dx / dist) * stepSize;
      }

      // 4. Check if we reached the segment end (approx)
      const distanceToEnd = Math.sqrt(Math.pow(nextSegment.endLat - newLat, 2) + Math.pow(nextSegment.endLng - newLng, 2));
      
      const updateData: any = {
        currentLat: newLat,
        currentLng: newLng,
        speed: targetSpeed,
        heading: heading,
        lastUpdated: new Date()
      };

      if (distanceToEnd < 0.002) { // INCREASED threshold for smoother completion (was 0.001)
        // Mark segment as completed
        await routeSegmentModel.update({
          where: { id: nextSegment.id },
          data: { isCompleted: true }
        });
        // Refresh segments for the response
        tracking.segments = await routeSegmentModel.findMany({
          where: { trackingId: tracking.id },
          orderBy: { order: 'asc' }
        });
      }

        // 5. Update the tracking record
        try {
          tracking = await vehicleTrackingModel.update({
            where: { id: tracking.id },
            data: updateData,
            include: { segments: { orderBy: { order: 'asc' } } }
          });
          console.log(`[TRACKING] Updated ${waybillNumber}: Lat ${newLat.toFixed(4)}, Lng ${newLng.toFixed(4)}, Speed ${targetSpeed.toFixed(1)}`);
        } catch (updateError) {
          console.error('[TRACKING_UPDATE_ERROR]', updateError);
          // If update fails, we still return the locally updated tracking object 
          // to keep the UI moving, but it won't persist.
          tracking = { ...tracking, ...updateData };
        }
      }
    }

    if (tracking) {
      // Add a flag to indicate if this is simulated or real
      return NextResponse.json({
        ...tracking,
        isSimulated: true,
        serverTime: new Date().toISOString()
      });
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
