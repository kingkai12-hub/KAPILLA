/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getLocationCoords } from '@/lib/locations';
import { deduplicateByWaybill } from '@/lib/request-deduplication';
import { requireAuth, requireRole } from '@/lib/auth';
import {
  buildRouteMetrics,
  normalizeRoutePoints,
  computeSimulation,
  pickCruiseKmh,
  DEFAULT_CRUISE_KMH,
} from '@/lib/tracking-simulation';
import { notifyArrival } from '@/lib/arrival-notification';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const STAFF_ROLES = ['ADMIN', 'STAFF', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO', 'ACCOUNTANT'];

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

/**
 * Records an arrival: one ARRIVED event + one alert to the operations team.
 * The shipment is intentionally left as IN_TRANSIT — staff confirm delivery.
 */
async function handleArrival(shipment: any, trackingEventModel: any): Promise<void> {
  if (trackingEventModel) {
    const existingArrival = await trackingEventModel.findFirst({
      where: { shipmentId: shipment.id, status: 'ARRIVED' },
    });
    if (!existingArrival) {
      await trackingEventModel.create({
        data: {
          shipmentId: shipment.id,
          status: 'ARRIVED',
          location: shipment.destination,
          remarks: 'Cargo has arrived at destination. Waiting for delivery confirmation.',
        },
      });
    }
  }

  await notifyArrival({
    waybillNumber: shipment.waybillNumber,
    origin: shipment.origin,
    destination: shipment.destination,
    senderName: shipment.senderName,
    receiverName: shipment.receiverName,
  });
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

    // ── TIME-BASED SIMULATION ──────────────────────────────────────────────
    // Position is a pure function of the stored anchor (lat/lng + time +
    // cruise speed) and the wall clock, so the truck keeps driving — and
    // catches up to exactly where it should be — even while nobody is online.
    if (
      tracking &&
      Array.isArray((tracking as any).routePoints) &&
      (tracking as any).routePoints.length > 1
    ) {
      const metrics = buildRouteMetrics(normalizeRoutePoints((tracking as any).routePoints));
      const travelling =
        shipment.currentStatus === 'IN_TRANSIT' || shipment.currentStatus === 'OUT_FOR_DELIVERY';

      // Not on the road yet (or already delivered): report the stored point.
      if (!travelling || metrics.points.length < 2) {
        return NextResponse.json({
          ...tracking,
          isSimulated: true,
          serverTime: new Date().toISOString(),
        });
      }

      // Rows created before this feature has no anchor: fall back to where the
      // vehicle currently sits, starting the clock now.
      const anchor = {
        lat: Number.isFinite((tracking as any).anchorLat)
          ? (tracking as any).anchorLat
          : tracking.currentLat,
        lng: Number.isFinite((tracking as any).anchorLng)
          ? (tracking as any).anchorLng
          : tracking.currentLng,
        atMs: (tracking as any).anchorAt
          ? new Date((tracking as any).anchorAt).getTime()
          : new Date((tracking as any).lastUpdated || Date.now()).getTime(),
        cruiseKmh: Number((tracking as any).cruiseSpeedKmh) || DEFAULT_CRUISE_KMH,
      };

      const sim = computeSimulation(metrics, anchor, Date.now());
      const lastPoint = metrics.points[metrics.points.length - 1];

      const updateData: any = {
        currentLat: sim.arrived ? lastPoint[0] : sim.lat,
        currentLng: sim.arrived ? lastPoint[1] : sim.lng,
        speed: sim.arrived ? 0 : sim.speedKmh,
        heading: sim.heading,
        lastUpdated: new Date(),
        // Persist the anchor (written once, or again after a staff snap).
        anchorLat: anchor.lat,
        anchorLng: anchor.lng,
        anchorAt: new Date(anchor.atMs),
        cruiseSpeedKmh: anchor.cruiseKmh,
      };

      if (sim.arrived) {
        updateData.isStopped = true;
        updateData.stopReason = 'Arrived at destination';
      } else if ((tracking as any).isStopped) {
        // A staff location update clears the stop so the journey continues.
        updateData.isStopped = false;
        updateData.stopReason = null;
      }

      try {
        tracking = await vehicleTrackingModel.update({
          where: { id: tracking.id },
          data: updateData,
          include: { segments: { orderBy: { order: 'asc' } } },
        });
      } catch {
        tracking = { ...tracking, ...updateData } as any;
      }

      if (sim.arrived) {
        await handleArrival(shipment, trackingEventModel);
        const arrivedTracking =
          (await vehicleTrackingModel.findUnique({
            where: { id: tracking.id },
            include: { segments: { orderBy: { order: 'asc' } } },
          })) || tracking;
        return NextResponse.json({
          ...arrivedTracking,
          arrived: true,
          isSimulated: true,
          serverTime: new Date().toISOString(),
        });
      }

      console.log(
        `[TRACKING] ${shipment.waybillNumber} at ${sim.lat.toFixed(5)},${sim.lng.toFixed(5)} | ${sim.speedKmh.toFixed(1)} km/h | ${(sim.remainingMeters / 1000).toFixed(1)} km remaining`
      );
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
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  if (!requireRole(auth.user!, STAFF_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
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
      lat,
      lng,
    } = body;

    // Resolve the staff member making this update (audit trail).
    const staff = await db.user.findUnique({
      where: { id: auth.user!.id },
      select: { name: true },
    });
    const staffName = staff?.name || null;

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

    // Picked up / dispatched milestones — recorded once, when first reached.
    if (status === 'PICKED_UP' && !shipment.pickedUpAt) {
      updateData.pickedUpAt = new Date();
    }
    if ((status === 'IN_TRANSIT' || status === 'OUT_FOR_DELIVERY') && !shipment.dispatchedAt) {
      updateData.dispatchedAt = new Date();
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
        staffId: auth.user!.id,
        staffName,
        timestamp: new Date(),
      },
    });

    // ── VEHICLE POSITIONING ────────────────────────────────────────────────
    // A staff location update becomes the vehicle's new ANCHOR: the truck
    // snaps there instantly, then carries on at cruise speed from that
    // moment — whether the new location is ahead of or behind where it was.
    if (vehicleTrackingModel && status !== 'DELIVERED') {
      // Prefer explicit coordinates (from geocoding or a dropped map pin) so
      // villages missing from the dropdown still work.
      let coords: { lat: number; lng: number } | null = null;
      const bodyLat = Number(lat);
      const bodyLng = Number(lng);
      if (
        Number.isFinite(bodyLat) &&
        Number.isFinite(bodyLng) &&
        (bodyLat !== 0 || bodyLng !== 0)
      ) {
        coords = { lat: bodyLat, lng: bodyLng };
      } else if (location) {
        coords = getLocationCoords(location) || null;
      }

      // First dispatch with no location yet → start the journey at origin.
      if (!coords && status === 'IN_TRANSIT') {
        coords = getLocationCoords(shipment.origin) || null;
      }

      if (coords) {
        const existing = await vehicleTrackingModel.findUnique({
          where: { shipmentId: shipment.id },
        });

        const routeOrigin = getLocationCoords(shipment.origin) || coords;
        const routeDest = getLocationCoords(shipment.destination) || coords;
        const poly = await getRoadRoute(
          routeOrigin.lat,
          routeOrigin.lng,
          routeDest.lat,
          routeDest.lng
        );

        const cruise = Number(existing?.cruiseSpeedKmh) || pickCruiseKmh();
        const now = new Date();

        await vehicleTrackingModel.upsert({
          where: { shipmentId: shipment.id },
          update: {
            currentLat: coords.lat,
            currentLng: coords.lng,
            speed: 0,
            routePoints: poly,
            anchorLat: coords.lat,
            anchorLng: coords.lng,
            anchorAt: now,
            cruiseSpeedKmh: cruise,
            lastUpdated: now,
            isStopped: false,
            stopUntil: null,
            stopReason: null,
          },
          create: {
            shipmentId: shipment.id,
            currentLat: coords.lat,
            currentLng: coords.lng,
            speed: 0,
            heading: 0,
            routePoints: poly,
            anchorLat: coords.lat,
            anchorLng: coords.lng,
            anchorAt: now,
            cruiseSpeedKmh: cruise,
            lastUpdated: now,
          },
        });
      } else {
        console.warn(
          `[TRACKING_POST] No coordinates for "${location}" (waybill ${shipment.waybillNumber}); vehicle not moved`
        );
      }
    }

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('[TRACKING_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
