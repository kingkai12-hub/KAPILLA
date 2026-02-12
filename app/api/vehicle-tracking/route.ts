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

// Generate route coordinates between origin and destination
function generateRoute(origin: string, destination: string): [number, number][] {
  const locations: Record<string, [number, number]> = {
    "Dar es Salaam": [-6.8151812, 39.2864692],
    "Mbeya": [-8.9094, 33.4608],
    "Mwanza": [-2.5164, 32.9175],
    "Arusha": [-3.3869, 36.6830],
    "Dodoma": [-6.1830, 35.7430],
    "Tanga": [-5.0689, 39.2988],
    "Morogoro": [-6.8240, 37.6618],
    "Iringa": [-7.7667, 35.7000],
    "Kigoma": [-4.8765, 29.6262],
    "Mtwara": [-10.3069, 40.1830],
  };

  const start = locations[origin];
  const end = locations[destination];

  if (!start || !end) {
    throw new Error(`Coordinates not found for ${origin} or ${destination}`);
  }

  // Generate intermediate waypoints for realistic route
  const route: [number, number][] = [start];
  
  // Add intermediate points based on major routes in Tanzania
  if (origin === "Dar es Salaam" && destination === "Mbeya") {
    route.push([-6.5, 37.0], [-7.0, 36.0], [-7.5, 34.5], [-8.0, 34.0], end);
  } else if (origin === "Dar es Salaam" && destination === "Mwanza") {
    route.push([-6.0, 37.5], [-5.5, 35.0], [-4.0, 33.0], [-3.0, 33.0], end);
  } else if (origin === "Dar es Salaam" && destination === "Arusha") {
    route.push([-6.0, 37.0], [-5.5, 36.5], [-4.5, 36.0], end);
  } else {
    // Default straight line with some intermediate points
    const steps = 5;
    for (let i = 1; i < steps; i++) {
      const lat = start[0] + (end[0] - start[0]) * (i / steps);
      const lng = start[1] + (end[1] - start[1]) * (i / steps);
      route.push([lat, lng]);
    }
    route.push(end);
  }

  return route;
}

// Calculate total distance of route
function calculateTotalDistance(route: [number, number][]): number {
  let totalDistance = 0;
  for (let i = 1; i < route.length; i++) {
    totalDistance += calculateDistance(
      route[i-1][0], route[i-1][1],
      route[i][0], route[i][1]
    );
  }
  return totalDistance;
}

// Determine if a segment is in city zone (simplified logic)
function isCityZoneCheck(lat: number, lng: number): boolean {
  const cities: Record<string, [number, number, number]> = {
    "Dar es Salaam": [-6.8151812, 39.2864692, 0.5],
    "Mbeya": [-8.9094, 33.4608, 0.3],
    "Mwanza": [-2.5164, 32.9175, 0.3],
    "Arusha": [-3.3869, 36.6830, 0.3],
    "Dodoma": [-6.1830, 35.7430, 0.3],
  };

  for (const [cityLat, cityLng, radius] of Object.values(cities)) {
    if (calculateDistance(lat, lng, cityLat, cityLng) <= radius * 1000) {
      return true;
    }
  }
  return false;
}

// GET: Retrieve vehicle tracking data
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const waybillNumber = searchParams.get('waybill');

    if (!waybillNumber) {
      return NextResponse.json({ error: 'Waybill number required' }, { status: 400 });
    }

    // Find shipment
    const shipment = await db.shipment.findUnique({
      where: { waybillNumber }
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // Check if tracking exists
    const existingTracking = await db.vehicleTracking.findUnique({
      where: { shipmentId: shipment.id }
    });

    // If no tracking exists, create it
    if (!existingTracking) {
      const route = generateRoute(shipment.origin, shipment.destination);
      const totalDistance = calculateTotalDistance(route);

      const tracking = await db.vehicleTracking.create({
        data: {
          shipmentId: shipment.id,
          routePath: route,
          currentLatitude: route[0][0],
          currentLongitude: route[0][1],
          totalDistance,
          isActive: shipment.currentStatus !== 'DELIVERED' && shipment.currentStatus !== 'CANCELLED'
        }
      });

      // Create route segments
      for (let i = 0; i < route.length - 1; i++) {
        const segmentDistance = calculateDistance(
          route[i][0], route[i][1],
          route[i+1][0], route[i+1][1]
        );
        
        await db.routeSegment.create({
          data: {
            trackingId: tracking.id,
            startLat: route[i][0],
            startLng: route[i][1],
            endLat: route[i+1][0],
            endLng: route[i+1][1],
            distance: segmentDistance,
            isCityZone: isCityZoneCheck(route[i][0], route[i][1]) || isCityZoneCheck(route[i+1][0], route[i+1][1]),
            speedLimit: isCityZoneCheck(route[i][0], route[i][1]) ? 40 : 80,
            orderIndex: i
          }
        });
      }

      return NextResponse.json({
        waybillNumber,
        route,
        currentPosition: { lat: route[0][0], lng: route[0][1] },
        progress: 0,
        completedPath: [],
        remainingPath: route,
        speed: 40,
        isActive: true
      });
    }

    const tracking = existingTracking;
    const route = tracking.routePath as [number, number][];
    
    // Calculate current position based on elapsed time
    const now = new Date();
    const timeDiff = (now.getTime() - tracking.lastUpdateTime.getTime()) / 1000; // seconds
    const distanceToMove = (tracking.currentSpeed * timeDiff * 1000) / 3600; // Convert km/h to m/s

    let newRouteIndex = tracking.routeIndex;
    let distanceInSegment = tracking.distanceCompleted;
    
    // Find current position along route
    let accumulatedDistance = 0;
    let currentPosition = route[tracking.routeIndex];
    let completedPath: [number, number][] = [];
    let remainingPath: [number, number][] = [];

    for (let i = 0; i < route.length; i++) {
      if (i <= tracking.routeIndex) {
        completedPath.push(route[i]);
      } else {
        remainingPath.push(route[i]);
      }
    }

    return NextResponse.json({
      waybillNumber,
      route,
      currentPosition: { 
        lat: tracking.currentLatitude, 
        lng: tracking.currentLongitude 
      },
      progress: tracking.progressPercent,
      completedPath,
      remainingPath,
      speed: tracking.currentSpeed,
      isActive: tracking.isActive && !tracking.isPaused,
      lastUpdate: tracking.lastUpdateTime
    });

  } catch (error) {
    console.error('[VEHICLE_TRACKING_GET_ERROR]', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

// POST: Update vehicle position or start tracking
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { waybillNumber, latitude, longitude, speed, isPaused } = body;

    if (!waybillNumber) {
      return NextResponse.json({ error: 'Waybill number required' }, { status: 400 });
    }

    const shipment = await db.shipment.findUnique({
      where: { waybillNumber }
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    let tracking = await db.vehicleTracking.findUnique({
      where: { shipmentId: shipment.id }
    });

    // Create tracking if it doesn't exist
    if (!tracking) {
      const route = generateRoute(shipment.origin, shipment.destination);
      const totalDistance = calculateTotalDistance(route);

      tracking = await db.vehicleTracking.create({
        data: {
          shipmentId: shipment.id,
          routePath: route,
          currentLatitude: latitude || route[0][0],
          currentLongitude: longitude || route[0][1],
          totalDistance,
          currentSpeed: speed || 40,
          isPaused: isPaused || false
        }
      });
    } else {
      // Update existing tracking
      const updateData: any = {
        lastUpdateTime: new Date()
      };

      if (latitude !== undefined && longitude !== undefined) {
        updateData.currentLatitude = latitude;
        updateData.currentLongitude = longitude;
      }

      if (speed !== undefined) {
        updateData.currentSpeed = speed;
      }

      if (isPaused !== undefined) {
        updateData.isPaused = isPaused;
      }

      tracking = await db.vehicleTracking.update({
        where: { id: tracking.id },
        data: updateData
      });
    }

    return NextResponse.json({ success: true, tracking });

  } catch (error) {
    console.error('[VEHICLE_TRACKING_POST_ERROR]', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
