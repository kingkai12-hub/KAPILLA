/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getLocationCoords } from '@/lib/locations';
import {
  calculateMovement,
  haversineDistance,
  DEFAULT_SPEED_CONFIG,
  type VehicleState,
  type RouteContext,
  type SpeedConfig,
} from '@/lib/speed-manager';
import { calculateHeading } from '@/lib/tracking-utils';
import { deduplicateByWaybill } from '@/lib/request-deduplication';
import { updateVehiclePosition } from '@/lib/autonomous-tracking';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const osrmCache: Map<string, { pts: [number, number][]; t: number }> = new Map();
const OSRM_TTL_MS = Number(process.env.OSRM_TTL_MS || 21600000); // 6 hours
const MAX_CACHE_SIZE = 1000; // Prevent memory leaks

/**
 * Get detailed road route from OSRM with MAXIMUM geometry detail
 * Uses overview=full, geometries=geojson, and annotations for complete road geometry
 *
 * OPTIMIZATIONS:
 * - Reduced coordinate precision to 3 decimals (~100m) for better cache hits
 * - LRU cache with size limit to prevent memory leaks
 * - Cache key normalization for consistent lookups
 */
async function getRoadRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<[number, number][]> {
  // Use 3 decimal places (~100m precision) for better cache hit rate
  // This allows routes with slightly different start/end points to share cache
  const key = `${startLat.toFixed(3)},${startLng.toFixed(3)}-${endLat.toFixed(3)},${endLng.toFixed(3)}`;
  const now = Date.now();

  // Check cache
  const hit = osrmCache.get(key);
  if (hit && now - hit.t < OSRM_TTL_MS && hit.pts.length > 1) {
    console.log(`[OSRM] Cache HIT for ${key} (${hit.pts.length} points)`);
    return hit.pts;
  }

  // Implement LRU cache eviction if cache is too large
  if (osrmCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest 20% of entries
    const entriesToRemove = Math.floor(MAX_CACHE_SIZE * 0.2);
    const sortedEntries = Array.from(osrmCache.entries()).sort((a, b) => a[1].t - b[1].t);

    for (let i = 0; i < entriesToRemove; i++) {
      osrmCache.delete(sortedEntries[i][0]);
    }

    console.log(`[OSRM] Cache eviction: removed ${entriesToRemove} old entries`);
  }

  // Request route with MAXIMUM detail:
  // - overview=full: Returns complete route geometry (not simplified)
  // - geometries=geojson: Returns coordinates in GeoJSON format
  // - continue_straight=false: Allows turns at intersections (more accurate)
  // - steps=true: Include turn-by-turn steps for more waypoints
  // - annotations=true: Include additional route annotations
  const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&continue_straight=false&steps=true&annotations=true`;

  try {
    const r = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (r.ok) {
      const j = await r.json();
      const coords = j?.routes?.[0]?.geometry?.coordinates?.map((c: any) => [c[1], c[0]]) || null;

      if (coords && coords.length > 1) {
        osrmCache.set(key, { pts: coords, t: now });
        console.log(
          `[OSRM] Cache MISS - Fetched route with ${coords.length} points from ${startLat.toFixed(4)},${startLng.toFixed(4)} to ${endLat.toFixed(4)},${endLng.toFixed(4)} (cache size: ${osrmCache.size})`
        );
        return coords;
      }
    }

    console.warn(`[OSRM] API returned invalid response for ${key}`);
  } catch (err) {
    console.error('[OSRM] Error fetching route:', err);
  }

  // Fallback to straight line if OSRM fails
  console.warn('[OSRM] Falling back to straight line');
  return [
    [startLat, startLng],
    [endLat, endLng],
  ];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const waybillNumber = searchParams.get('waybillNumber');

  if (!waybillNumber) {
    return NextResponse.json({ error: 'Waybill number is required' }, { status: 400 });
  }

  try {
    const normalized = waybillNumber.trim();

    // Defensive model access to handle case-sensitivity in generated Prisma client
    const shipmentModel = (db as any).Shipment || (db as any).shipment;
    const vehicleTrackingModel = (db as any).VehicleTracking || (db as any).vehicleTracking;
    const routeSegmentModel = (db as any).RouteSegment || (db as any).routeSegment;
    const trackingEventModel = (db as any).TrackingEvent || (db as any).trackingEvent;

    if (!shipmentModel || !vehicleTrackingModel || !routeSegmentModel) {
      console.warn('[TRACKING_GET] One or more models missing, degrading gracefully', {
        available: Object.keys(db || {}).filter((k) => !k.startsWith('$')),
      });
      // Try to return minimal payload using shipment model if available
      if (shipmentModel) {
        const shipment = await shipmentModel.findFirst({
          where: { waybillNumber: { equals: normalized, mode: 'insensitive' } },
        });
        if (!shipment) {
          return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
        }
        const startCoords = getLocationCoords(shipment.origin) || { lat: -6.7924, lng: 39.2083 };
        const endCoords = getLocationCoords(shipment.destination) || { lat: -2.5164, lng: 32.9033 };
        // Use OSRM for detailed road geometry
        const poly = await getRoadRoute(
          startCoords.lat,
          startCoords.lng,
          endCoords.lat,
          endCoords.lng
        );
        let totalMeters = 0;
        for (let i = 0; i < poly.length - 1; i++) {
          totalMeters += haversineMeters(poly[i][0], poly[i][1], poly[i + 1][0], poly[i + 1][1]);
        }
        const targetKmh = 65;
        const cycle = Math.max(3600000, (totalMeters / 1000 / targetKmh) * 3600000);
        const now = Date.now();
        const progress = (now % cycle) / cycle;
        const idx = Math.min(Math.floor(progress * (poly.length - 1)), poly.length - 2);
        const frac = progress * (poly.length - 1) - idx;
        const a = poly[idx];
        const b = poly[idx + 1];
        const curLat = a[0] + (b[0] - a[0]) * frac;
        const curLng = a[1] + (b[1] - a[1]) * frac;
        const dy = b[0] - a[0];
        const dx = b[1] - a[1];
        const heading = (Math.atan2(dx, dy) * 180) / Math.PI;
        const speed = 60;
        return NextResponse.json({
          currentLat: curLat,
          currentLng: curLng,
          speed,
          heading,
          routePoints: poly,
          isSimulated: true,
          serverTime: new Date().toISOString(),
          degraded: true,
        });
      }
      // If even shipment model is missing, return a static but valid response
      return NextResponse.json({
        currentLat: -6.7924,
        currentLng: 39.2083,
        speed: 0,
        heading: 0,
        routePoints: [
          [-6.7924, 39.2083],
          [-2.5164, 32.9033],
        ],
        isSimulated: true,
        serverTime: new Date().toISOString(),
        degraded: true,
      });
    }

    const shipment = await shipmentModel.findFirst({
      where: { waybillNumber: { equals: normalized, mode: 'insensitive' } },
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    let tracking = await vehicleTrackingModel.findUnique({
      where: { shipmentId: shipment.id },
    });

    // ROUTE REGENERATION LOGIC
    // Only regenerate route if:
    // 1. No tracking exists
    // 2. No routePoints exist
    // DO NOT regenerate based on point count - route from POST endpoint is always valid
    const needsRegeneration =
      !tracking ||
      !(tracking as any).routePoints ||
      !Array.isArray((tracking as any).routePoints) ||
      (tracking as any).routePoints.length < 2;

    if (needsRegeneration) {
      const startCoords = getLocationCoords(shipment.origin) || { lat: -6.7924, lng: 39.2083 };
      const endCoords = getLocationCoords(shipment.destination) || { lat: -2.5164, lng: 32.9033 };

      // Always use OSRM for detailed road geometry (not corridor routes)
      // OSRM provides complete road geometry with all curves and bends
      const poly = await getRoadRoute(
        startCoords.lat,
        startCoords.lng,
        endCoords.lat,
        endCoords.lng
      );

      console.log(
        `[TRACKING] ${tracking ? 'Regenerated' : 'Created'} route with ${poly.length} points from ${shipment.origin} to ${shipment.destination}`
      );

      // Skip segment creation - we use routePoints directly for better performance
      if (!tracking) {
        tracking = await vehicleTrackingModel.create({
          data: {
            shipmentId: shipment.id,
            currentLat: poly[0][0],
            currentLng: poly[0][1],
            speed: 0, // Start at 0 so vehicle stays at origin until first movement
            heading: 0,
            routePoints: poly,
          },
        });
      } else {
        await vehicleTrackingModel.update({
          where: { id: tracking.id },
          data: { routePoints: poly },
        });
        tracking = await vehicleTrackingModel.findUnique({
          where: { id: tracking.id },
        });
      }
    }

    // MOVEMENT LOGIC - Enhanced with realistic speed behavior
    if (
      tracking &&
      (tracking as any).routePoints &&
      Array.isArray((tracking as any).routePoints) &&
      (tracking as any).routePoints.length > 1
    ) {
      const poly: [number, number][] = (tracking as any).routePoints;
      const total = poly.length;

      // CHECK IF VEHICLE WAS JUST RESET (at origin with speed 0)
      // If so, don't move it yet - wait for client-side tracker or cron job
      const isAtOrigin =
        Math.abs(tracking.currentLat - poly[0][0]) < 0.0001 &&
        Math.abs(tracking.currentLng - poly[0][1]) < 0.0001;
      const isStationary = tracking.speed === 0 || tracking.speed === null;

      if (isAtOrigin && isStationary && shipment.currentStatus === 'IN_TRANSIT') {
        console.log('[TRACKING] Vehicle at origin, waiting for first movement');
        // Return current position without moving
        return NextResponse.json({
          ...tracking,
          isSimulated: true,
          serverTime: new Date().toISOString(),
        });
      }

      // CHECK FOR MANUAL LOCATION UPDATES FROM ADMIN
      // If admin created a tracking event with a location, jump vehicle to that location
      if (trackingEventModel) {
        const latestEvent = await trackingEventModel.findFirst({
          where: {
            shipmentId: shipment.id,
            location: { not: null },
          },
          orderBy: { timestamp: 'desc' },
        });

        if (latestEvent && latestEvent.location && latestEvent.location !== 'Admin Update') {
          // Check if this is a new location update (after last vehicle update)
          const lastUpdate = tracking.lastUpdated
            ? new Date(tracking.lastUpdated as any)
            : new Date(0);
          const eventTime = new Date(latestEvent.timestamp);

          if (eventTime > lastUpdate) {
            // Admin updated location - jump vehicle to this location
            const locationCoords = getLocationCoords(latestEvent.location);
            if (locationCoords) {
              console.log(`[TRACKING] Admin location update detected: ${latestEvent.location}`);

              // Update vehicle position to the new location
              await vehicleTrackingModel.update({
                where: { id: tracking.id },
                data: {
                  currentLat: locationCoords.lat,
                  currentLng: locationCoords.lng,
                  lastUpdated: new Date(),
                  speed: 0, // Reset speed when jumping to new location
                },
              });

              // Refresh tracking data
              tracking = await vehicleTrackingModel.findUnique({
                where: { id: tracking.id },
                include: { segments: { orderBy: { order: 'asc' } } },
              });
            }
          }
        }
      }

      // Find closest point on route
      let iClosest = 0;
      let minD = Infinity;
      for (let i = 0; i < total; i++) {
        const dLat = poly[i][0] - tracking.currentLat;
        const dLng = poly[i][1] - tracking.currentLng;
        const d = dLat * dLat + dLng * dLng;
        if (d < minD) {
          minD = d;
          iClosest = i;
        }
      }
      let targetIdx = Math.min(iClosest + 1, total - 1);

      // Calculate route context
      const dest = poly[poly.length - 1];
      const remainingDistance = haversineDistance(
        tracking.currentLat,
        tracking.currentLng,
        dest[0],
        dest[1]
      );
      let totalDistance = 0;
      for (let i = 0; i < poly.length - 1; i++) {
        totalDistance += haversineDistance(poly[i][0], poly[i][1], poly[i + 1][0], poly[i + 1][1]);
      }

      const routeContext: RouteContext = {
        routePoints: poly,
        currentIndex: iClosest,
        totalDistance,
        remainingDistance,
        progressRatio: targetIdx / (total - 1),
      };

      // Create vehicle state
      const vehicleState: VehicleState = {
        currentLat: tracking.currentLat,
        currentLng: tracking.currentLng,
        speed: typeof tracking.speed === 'number' ? tracking.speed : 0,
        heading: tracking.heading || 0,
        lastUpdated: tracking.lastUpdated ? new Date(tracking.lastUpdated as any) : new Date(),
        isStopped: (tracking as any).isStopped || false,
        stopUntil: (tracking as any).stopUntil || undefined,
        stopReason: (tracking as any).stopReason || undefined,
        speedVariationOffset: (tracking as any).speedVariationOffset || 0,
        lastVariationUpdate: (tracking as any).lastVariationUpdate || 0,
      };

      // Speed configuration (can be customized via env vars)
      const speedConfig: SpeedConfig = {
        ...DEFAULT_SPEED_CONFIG,
        citySpeedMin: Number(process.env.CITY_SPEED_MIN_KMH || 20),
        citySpeedMax: Number(process.env.CITY_SPEED_MAX_KMH || 50),
        highwaySpeedMin: Number(process.env.HIGHWAY_SPEED_MIN_KMH || 60),
        highwaySpeedMax: Number(process.env.HIGHWAY_SPEED_MAX_KMH || 90),
        accelRate: Number(process.env.SPEED_ACCEL_KMHPS || 8),
        decelRate: Number(process.env.SPEED_DECEL_KMHPS || 12),
        speedVariation: Number(process.env.SPEED_VARIATION_KMH || 5),
        enableTrafficStops: process.env.ENABLE_TRAFFIC_STOPS !== 'false',
      };

      // Calculate movement with realistic speed behavior
      const movement = calculateMovement(vehicleState, routeContext, speedConfig);

      // Move vehicle along route
      let distToTravel = movement.distanceToTravel;
      let curLat = tracking.currentLat;
      let curLng = tracking.currentLng;
      let traveled = 0;

      while (distToTravel > 0 && targetIdx < total) {
        const aLat = curLat;
        const aLng = curLng;
        const bLat = poly[targetIdx][0];
        const bLng = poly[targetIdx][1];
        const dy = bLat - aLat;
        const dx = bLng - aLng;
        const segLen = haversineDistance(aLat, aLng, bLat, bLng);

        if (segLen <= distToTravel && segLen > 0) {
          curLat = bLat;
          curLng = bLng;
          distToTravel -= segLen;
          traveled += segLen;
          targetIdx += 1;
        } else if (segLen > 0) {
          const ratio = distToTravel / segLen;
          curLat = aLat + dy * ratio;
          curLng = aLng + dx * ratio;
          traveled += distToTravel;
          distToTravel = 0;
        } else {
          targetIdx += 1;
        }
      }

      // Calculate heading with robust edge case handling
      const targetPoint = poly[Math.min(targetIdx, total - 1)];
      const heading = calculateHeading(
        curLat,
        curLng,
        targetPoint[0],
        targetPoint[1],
        tracking.heading || 0 // Use previous heading as fallback
      );

      // Update tracking with new position and speed
      const updateData: any = {
        currentLat: curLat,
        currentLng: curLng,
        speed: movement.newSpeed,
        heading,
        lastUpdated: new Date(),
        // Persist traffic simulation state
        isStopped: vehicleState.isStopped,
        stopUntil: vehicleState.stopUntil,
        stopReason: vehicleState.stopReason,
        speedVariationOffset: vehicleState.speedVariationOffset,
        lastVariationUpdate: vehicleState.lastVariationUpdate,
      };

      console.log(
        `[TRACKING] Vehicle at ${curLat.toFixed(5)},${curLng.toFixed(5)} | Speed: ${movement.newSpeed.toFixed(1)} km/h | Reason: ${movement.reason} | Remaining: ${(remainingDistance / 1000).toFixed(1)} km`
      );

      try {
        tracking = await vehicleTrackingModel.update({
          where: { id: tracking.id },
          data: updateData,
          include: { segments: { orderBy: { order: 'asc' } } },
        });
      } catch {
        tracking = { ...tracking, ...updateData } as any;
      }

      // Check if reached destination
      const remain = haversineDistance(curLat, curLng, dest[0], dest[1]);
      if (remain < 50) {
        try {
          if (shipment.currentStatus !== 'DELIVERED') {
            await shipmentModel.update({
              where: { id: shipment.id },
              data: { currentStatus: 'DELIVERED' },
            });
            if (trackingEventModel) {
              await trackingEventModel.create({
                data: {
                  shipmentId: shipment.id,
                  status: 'DELIVERED',
                  location: `${dest[0].toFixed(5)},${dest[1].toFixed(5)}`,
                },
              });
            }
          }
        } catch {}
      }
    }
    // NOTE: Old segment-based and straight-line fallbacks removed
    // All routes now use OSRM routePoints for accurate road-following
    // If routePoints are missing, they will be regenerated on next request

    if (!tracking) {
      return NextResponse.json({ error: 'Tracking not found' }, { status: 404 });
    }

    let payload: any = { ...tracking };
    if (!payload.segments || payload.segments.length === 0) {
      const startCoords = getLocationCoords(shipment.origin) || { lat: -6.7924, lng: 39.2083 };
      const endCoords = getLocationCoords(shipment.destination) || { lat: -2.5164, lng: 32.9033 };
      const numSegments = 100;
      const segmentsData: any[] = [];
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
          order: i,
        });
      }
      payload = { ...payload, segments: segmentsData };
    }
    return NextResponse.json({
      ...payload,
      isSimulated: true,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[TRACKING_GET]', error);
    // HARDENED FALLBACK: Try to get actual shipment data for fallback
    try {
      const normalized = waybillNumber?.trim() || '';
      const shipmentModel = (db as any).Shipment || (db as any).shipment;

      let startName = 'Dar es Salaam';
      let endName = 'Mwanza';

      // Try to get actual shipment origin/destination
      if (shipmentModel && normalized) {
        try {
          const shipment = await shipmentModel.findFirst({
            where: { waybillNumber: { equals: normalized, mode: 'insensitive' } },
          });
          if (shipment) {
            startName = shipment.origin || startName;
            endName = shipment.destination || endName;
          }
        } catch (e) {
          console.error('[TRACKING_GET] Failed to fetch shipment for fallback:', e);
        }
      }

      const start = getLocationCoords(startName) || { lat: -6.7924, lng: 39.2083 };
      const end = getLocationCoords(endName) || { lat: -2.5164, lng: 32.9033 };
      // Use OSRM for detailed road geometry
      const poly = await getRoadRoute(start.lat, start.lng, end.lat, end.lng);
      const haversineMeters = (aLat: number, aLng: number, bLat: number, bLng: number) => {
        const toRad = (d: number) => (d * Math.PI) / 180;
        const R = 6371000;
        const dLat = toRad(bLat - aLat);
        const dLng = toRad(bLng - aLng);
        const A =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
        const C = 2 * Math.atan2(Math.sqrt(A), Math.sqrt(1 - A));
        return R * C;
      };
      let totalMeters = 0;
      for (let i = 0; i < poly.length - 1; i++) {
        totalMeters += haversineMeters(poly[i][0], poly[i][1], poly[i + 1][0], poly[i + 1][1]);
      }
      const targetKmh = 65;
      const cycle = Math.max(3600000, (totalMeters / 1000 / targetKmh) * 3600000);
      const now = Date.now();
      const progress = (now % cycle) / cycle;
      const idx = Math.min(Math.floor(progress * (poly.length - 1)), poly.length - 2);
      const frac = progress * (poly.length - 1) - idx;
      const a = poly[idx];
      const b = poly[idx + 1];
      const curLat = a[0] + (b[0] - a[0]) * frac;
      const curLng = a[1] + (b[1] - a[1]) * frac;
      const dy = b[0] - a[0];
      const dx = b[1] - a[1];
      const heading = (Math.atan2(dx, dy) * 180) / Math.PI;
      const speed = 40;
      return NextResponse.json({
        currentLat: curLat,
        currentLng: curLng,
        speed,
        heading,
        routePoints: poly,
        origin: startName,
        destination: endName,
        isSimulated: true,
        degraded: true,
        serverTime: new Date().toISOString(),
        fallback: true,
      });
    } catch {
      return NextResponse.json({
        currentLat: -6.7924,
        currentLng: 39.2083,
        speed: 0,
        heading: 0,
        routePoints: [
          [-6.7924, 39.2083],
          [-2.5164, 32.9033],
        ],
        isSimulated: true,
        degraded: true,
        serverTime: new Date().toISOString(),
        fallback: true,
      });
    }
  }
}

// Simple haversine distance in meters
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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
      transportType,
    } = body;

    const shipmentModel = (db as any).Shipment || (db as any).shipment;
    const trackingEventModel = (db as any).TrackingEvent || (db as any).trackingEvent;
    const vehicleTrackingModel = (db as any).VehicleTracking || (db as any).vehicleTracking;

    if (!shipmentModel || !trackingEventModel) {
      return NextResponse.json({ error: 'Database models not initialized' }, { status: 500 });
    }

    const shipment = await shipmentModel.findUnique({
      where: { waybillNumber: waybillNumber },
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // Update shipment status
    const updateData: any = { currentStatus: status };

    // If status is DELIVERED, set deliveredAt timestamp
    if (status === 'DELIVERED' && shipment.currentStatus !== 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }

    // Update shipment if not already delivered
    if (shipment.currentStatus !== 'DELIVERED') {
      await shipmentModel.update({
        where: { id: shipment.id },
        data: updateData,
      });
    }

    // Create tracking event
    const event = await trackingEventModel.create({
      data: {
        shipmentId: shipment.id,
        status: status,
        location: location || 'Unknown',
        remarks: remarks || `Shipment is ${status.toLowerCase().replace('_', ' ')}`,
        timestamp: new Date(),
      },
    });

    // IMPORTANT: When status changes to IN_TRANSIT, reset vehicle to origin
    if (status === 'IN_TRANSIT' && vehicleTrackingModel) {
      const originCoords = getLocationCoords(shipment.origin);
      if (originCoords) {
        console.log(`[TRACKING] Resetting vehicle to origin: ${shipment.origin}`);

        // Get or create route
        const destCoords = getLocationCoords(shipment.destination);
        if (destCoords) {
          const poly = await getRoadRoute(
            originCoords.lat,
            originCoords.lng,
            destCoords.lat,
            destCoords.lng
          );

          await vehicleTrackingModel.upsert({
            where: { shipmentId: shipment.id },
            update: {
              currentLat: poly[0][0],
              currentLng: poly[0][1],
              speed: 0,
              heading: 0,
              routePoints: poly,
              lastUpdated: new Date(),
              isStopped: false,
              stopUntil: null,
            },
            create: {
              shipmentId: shipment.id,
              currentLat: poly[0][0],
              currentLng: poly[0][1],
              speed: 0,
              heading: 0,
              routePoints: poly,
              lastUpdated: new Date(),
            },
          });
        }
      }
    }
    // Update vehicle tracking position if location is recognized (for other status updates)
    else if (location && vehicleTrackingModel) {
      const coords = getLocationCoords(location);
      if (coords) {
        await vehicleTrackingModel.upsert({
          where: { shipmentId: shipment.id },
          update: {
            currentLat: coords.lat,
            currentLng: coords.lng,
            lastUpdated: new Date(),
          },
          create: {
            shipmentId: shipment.id,
            currentLat: coords.lat,
            currentLng: coords.lng,
            speed: 0,
            heading: 0,
            lastUpdated: new Date(),
          },
        });
      }
    }

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('[TRACKING_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
