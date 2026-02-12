import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Interpolate position between two points
function interpolatePosition(
  startLat: number, startLng: number,
  endLat: number, endLng: number,
  progress: number
): [number, number] {
  const lat = startLat + (endLat - startLat) * progress;
  const lng = startLng + (endLng - startLng) * progress;
  return [lat, lng];
}

// Simulate vehicle movement for all active shipments
export async function POST(req: Request) {
  try {
    console.log('[VEHICLE_SIMULATION] Starting simulation cycle...');
    
    // Get all active vehicle tracking records
    const activeTrackings = await db.vehicleTracking.findMany({
      where: {
        isActive: true,
        isPaused: false
      },
      include: {
        shipment: {
          select: {
            currentStatus: true
          }
        }
      }
    });

    console.log(`[VEHICLE_SIMULATION] Processing ${activeTrackings.length} active vehicles`);

    const results = [];

    for (const tracking of activeTrackings) {
      // Skip if shipment is delivered or cancelled
      if (tracking.shipment.currentStatus === 'DELIVERED' || 
          tracking.shipment.currentStatus === 'CANCELLED') {
        await db.vehicleTracking.update({
          where: { id: tracking.id },
          data: { isActive: false }
        });
        continue;
      }

      const now = new Date();
      const timeDiff = (now.getTime() - tracking.lastUpdateTime.getTime()) / 1000; // seconds
      
      // Skip if no time has passed
      if (timeDiff < 1) continue;

      const route = tracking.routePath as [number, number][];
      if (!route || route.length < 2) continue;

      // Calculate distance to move based on speed and time
      const distanceToMove = (tracking.currentSpeed * timeDiff * 1000) / 3600; // Convert km/h to m/s
      
      let newDistanceCompleted = tracking.distanceCompleted + distanceToMove;
      let newRouteIndex = tracking.routeIndex;
      let currentLat = tracking.currentLatitude;
      let currentLng = tracking.currentLongitude;
      let isCompleted = false;

      // Find current position along route
      let accumulatedDistance = 0;
      let foundSegment = false;

      for (let i = 0; i < route.length - 1; i++) {
        const segmentDistance = calculateDistance(
          route[i][0], route[i][1],
          route[i+1][0], route[i+1][1]
        );

        if (i < tracking.routeIndex) {
          accumulatedDistance += segmentDistance;
          continue;
        }

        const segmentStart = accumulatedDistance;
        const segmentEnd = accumulatedDistance + segmentDistance;

        if (newDistanceCompleted >= segmentStart && newDistanceCompleted <= segmentEnd) {
          // Vehicle is within this segment
          const segmentProgress = (newDistanceCompleted - segmentStart) / segmentDistance;
          [currentLat, currentLng] = interpolatePosition(
            route[i][0], route[i][1],
            route[i+1][0], route[i+1][1],
            segmentProgress
          );
          
          newRouteIndex = i;
          foundSegment = true;
          break;
        }

        accumulatedDistance += segmentDistance;
      }

      // Check if journey is completed
      if (newDistanceCompleted >= tracking.totalDistance) {
        currentLat = route[route.length - 1][0];
        currentLng = route[route.length - 1][1];
        newDistanceCompleted = tracking.totalDistance;
        newRouteIndex = route.length - 1;
        isCompleted = true;
      } else if (!foundSegment) {
        // Fallback to last known position if calculation fails
        currentLat = tracking.currentLatitude;
        currentLng = tracking.currentLongitude;
      }

      // Calculate progress percentage
      const progressPercent = Math.min((newDistanceCompleted / tracking.totalDistance) * 100, 100);

      // Determine speed based on city zone
      const isCityZone = isCityZoneCheck(currentLat, currentLng);
      const newSpeed = isCityZone ? 
        Math.random() * 30 + 20 : // 20-50 km/h in city
        Math.random() * 40 + 60;  // 60-100 km/h on highway

      // Update tracking record
      const updateData: any = {
        currentLatitude: currentLat,
        currentLongitude: currentLng,
        routeIndex: newRouteIndex,
        distanceCompleted: newDistanceCompleted,
        progressPercent,
        currentSpeed: newSpeed,
        isCityZone,
        lastUpdateTime: now,
        isActive: !isCompleted
      };

      const updatedTracking = await db.vehicleTracking.update({
        where: { id: tracking.id },
        data: updateData
      });

      // If journey completed, update shipment status
      if (isCompleted) {
        await db.shipment.update({
          where: { id: tracking.shipmentId },
          data: { currentStatus: 'DELIVERED' }
        });

        // Create tracking event
        await db.trackingEvent.create({
          data: {
            shipmentId: tracking.shipmentId,
            status: 'DELIVERED',
            location: 'Destination',
            remarks: 'Vehicle arrived at destination'
          }
        });
      }

      results.push({
        trackingId: tracking.id,
        waybillNumber: tracking.shipmentId,
        position: { lat: currentLat, lng: currentLng },
        progress: progressPercent,
        speed: newSpeed,
        isCompleted
      });
    }

    console.log(`[VEHICLE_SIMULATION] Completed simulation. Updated ${results.length} vehicles`);

    return NextResponse.json({ 
      success: true, 
      updated: results.length,
      results 
    });

  } catch (error) {
    console.error('[VEHICLE_SIMULATION_ERROR]', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

// Check if position is in city zone
function isCityZoneCheck(lat: number, lng: number): boolean {
  const cities: Record<string, [number, number, number]> = {
    "Dar es Salaam": [-6.8151812, 39.2864692, 0.5],
    "Mbeya": [-8.9094, 33.4608, 0.3],
    "Mwanza": [-2.5164, 32.9175, 0.3],
    "Arusha": [-3.3869, 36.6830, 0.3],
    "Dodoma": [-6.1830, 35.7430, 0.3],
    "Tanga": [-5.0689, 39.2988, 0.3],
    "Morogoro": [-6.8240, 37.6618, 0.3],
  };

  for (const [cityLat, cityLng, radius] of Object.values(cities)) {
    if (calculateDistance(lat, lng, cityLat, cityLng) <= radius * 1000) {
      return true;
    }
  }
  return false;
}

// GET: Get simulation status
export async function GET(req: Request) {
  try {
    const activeCount = await db.vehicleTracking.count({
      where: { isActive: true, isPaused: false }
    });

    const totalCount = await db.vehicleTracking.count({
      where: { isActive: true }
    });

    return NextResponse.json({
      active: activeCount,
      total: totalCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[VEHICLE_SIMULATION_GET_ERROR]', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
