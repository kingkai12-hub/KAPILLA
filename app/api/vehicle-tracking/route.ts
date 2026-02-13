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

// Generate route coordinates between origin and destination using OSRM or fallback
async function generateRoute(origin: string, destination: string): Promise<[number, number][]> {
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
    "Singida": [-4.8150, 34.7436],
    "Shinyanga": [-3.6619, 33.4232],
    "Tabora": [-5.0162, 32.8132],
    "Musoma": [-1.4989, 33.8047],
    "Bukoba": [-1.3320, 31.8122],
    "Sumbawanga": [-7.9667, 31.6167],
    "Songea": [-10.6833, 35.6500],
    "Lindi": [-9.9967, 39.7133],
    "Zanzibar": [-6.1659, 39.2026],
  };

  const start = locations[origin];
  const end = locations[destination];

  if (!start || !end) {
    // If not in our list, try to return a straight line at least
    console.warn(`Coordinates not found for ${origin} or ${destination}, using straight line fallback`);
    const s = start || [-6.8151, 39.2865]; // Fallback to Dar
    const e = end || [-2.5164, 32.9175];   // Fallback to Mwanza
    return [s, e];
  }

  try {
    // Try to get actual road route from OSRM
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
    const response = await fetch(osrmUrl);
    if (response.ok) {
      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const coords = data.routes[0].geometry.coordinates;
        // OSRM returns [lng, lat], we need [lat, lng]
        return coords.map((c: [number, number]) => [c[1], c[0]]);
      }
    }
  } catch (err) {
    console.error('OSRM routing failed, falling back to enhanced manual route:', err);
  }

  // Fallback: Enhanced manual routes following main highways
  const route: [number, number][] = [start];
  
  if (origin === "Dar es Salaam" && destination === "Mbeya") {
    route.push([-6.8240, 37.6618]); // Morogoro
    route.push([-7.4000, 36.5000]); // Mikumi
    route.push([-7.7667, 35.7000]); // Iringa
    route.push([-8.3000, 34.5000]); // Makambako
  } else if (origin === "Dar es Salaam" && destination === "Mwanza") {
    route.push([-6.8240, 37.6618]); // Morogoro
    route.push([-6.1830, 35.7430]); // Dodoma
    route.push([-4.8150, 34.7436]); // Singida
    route.push([-4.0000, 33.5000]); // Nzega
    route.push([-3.6619, 33.4232]); // Shinyanga
  } else if (origin === "Dar es Salaam" && destination === "Arusha") {
    route.push([-6.1000, 38.2000]); // Chalinze
    route.push([-5.0689, 38.3000]); // Korogwe
    route.push([-4.5000, 38.0000]); // Same
    route.push([-3.3500, 37.3333]); // Moshi
  } else if (origin === "Mwanza" && destination === "Dar es Salaam") {
    route.push([-3.6619, 33.4232]); // Shinyanga
    route.push([-4.0000, 33.5000]); // Nzega
    route.push([-4.8150, 34.7436]); // Singida
    route.push([-6.1830, 35.7430]); // Dodoma
    route.push([-6.8240, 37.6618]); // Morogoro
  }

  route.push(end);
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
      const route = await generateRoute(shipment.origin, shipment.destination);
      const totalDistance = calculateTotalDistance(route);

      const tracking = await db.vehicleTracking.create({
        data: {
          shipmentId: shipment.id,
          routePath: route,
          currentLatitude: route[0][0],
          currentLongitude: route[0][1],
          totalDistance,
          isActive: shipment.currentStatus !== 'DELIVERED' && shipment.currentStatus !== 'CANCELLED',
          routeSegments: {
            create: route.slice(0, -1).map((point, i) => {
              const startLat = point[0];
              const startLng = point[1];
              const endLat = route[i+1][0];
              const endLng = route[i+1][1];
              const segmentDistance = calculateDistance(startLat, startLng, endLat, endLng);
              const inCity = isCityZoneCheck(startLat, startLng) || isCityZoneCheck(endLat, endLng);
              
              return {
                startLat,
                startLng,
                endLat,
                endLng,
                distance: segmentDistance,
                isCityZone: inCity,
                speedLimit: inCity ? 40 : 80,
                orderIndex: i
              };
            })
          }
        }
      });

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
      // Construct completed and remaining paths smoothly
    const completedPath: [number, number][] = [];
    const remainingPath: [number, number][] = [];

    // Current position
    const currentPos: [number, number] = [tracking.currentLatitude, tracking.currentLongitude];

    // Build completed path: all points up to routeIndex, then currentPos
    for (let i = 0; i <= tracking.routeIndex && i < route.length; i++) {
      completedPath.push(route[i]);
    }
    
    // Only add currentPos if it's not already the last point (avoids duplicates)
    const lastCompleted = completedPath[completedPath.length - 1];
    if (!lastCompleted || (lastCompleted[0] !== currentPos[0] || lastCompleted[1] !== currentPos[1])) {
      completedPath.push(currentPos);
    }

    // Build remaining path: currentPos, then all points after routeIndex
    remainingPath.push(currentPos);
    for (let i = tracking.routeIndex + 1; i < route.length; i++) {
      remainingPath.push(route[i]);
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
      const route = await generateRoute(shipment.origin, shipment.destination);
      const totalDistance = calculateTotalDistance(route);

      tracking = await db.vehicleTracking.create({
        data: {
          shipmentId: shipment.id,
          routePath: route,
          currentLatitude: latitude !== undefined ? latitude : route[0][0],
          currentLongitude: longitude !== undefined ? longitude : route[0][1],
          totalDistance,
          currentSpeed: speed || 40,
          isPaused: isPaused || false,
          isActive: shipment.currentStatus !== 'DELIVERED' && shipment.currentStatus !== 'CANCELLED',
          routeSegments: {
            create: route.slice(0, -1).map((point, i) => {
              const startLat = point[0];
              const startLng = point[1];
              const endLat = route[i+1][0];
              const endLng = route[i+1][1];
              const segmentDistance = calculateDistance(startLat, startLng, endLat, endLng);
              const inCity = isCityZoneCheck(startLat, startLng) || isCityZoneCheck(endLat, endLng);
              
              return {
                startLat,
                startLng,
                endLat,
                endLng,
                distance: segmentDistance,
                isCityZone: inCity,
                speedLimit: inCity ? 40 : 80,
                orderIndex: i
              };
            })
          }
        }
      });
    } else {
      // Update existing tracking
      const updateData: any = {
        lastUpdateTime: new Date()
      };

      if (latitude !== undefined) updateData.currentLatitude = latitude;
      if (longitude !== undefined) updateData.currentLongitude = longitude;
      if (speed !== undefined) updateData.currentSpeed = speed;
      if (isPaused !== undefined) updateData.isPaused = isPaused;

      // Update progress if route index is provided
      if (body.routeIndex !== undefined) updateData.routeIndex = body.routeIndex;
      if (body.distanceCompleted !== undefined) updateData.distanceCompleted = body.distanceCompleted;
      if (body.progressPercent !== undefined) updateData.progressPercent = body.progressPercent;
      if (body.isCityZone !== undefined) updateData.isCityZone = body.isCityZone;

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
