import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { locationCoords, getLocationCoords } from '@/lib/locations';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const osrmCache: Map<string, { pts: [number, number][], t: number }> = new Map();
const OSRM_TTL_MS = Number(process.env.OSRM_TTL_MS || 21600000);
async function getRoadRoute(startLat: number, startLng: number, endLat: number, endLng: number): Promise<[number, number][]> {
  const key = `${startLat.toFixed(5)},${startLng.toFixed(5)}-${endLat.toFixed(5)},${endLng.toFixed(5)}`;
  const now = Date.now();
  const hit = osrmCache.get(key);
  if (hit && now - hit.t < OSRM_TTL_MS && hit.pts.length > 1) return hit.pts;
  const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=false`;
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (r.ok) {
      const j = await r.json();
      const coords = j?.routes?.[0]?.geometry?.coordinates?.map((c: any) => [c[1], c[0]]) || null;
      if (coords && coords.length > 1) {
        osrmCache.set(key, { pts: coords, t: now });
        return coords;
      }
    }
  } catch {}
  return [
    [startLat, startLng],
    [endLat, endLng]
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
    const CITY_SPEED_MIN = Number(process.env.CITY_SPEED_MIN_KMH || 20);
    const CITY_SPEED_MAX = Number(process.env.CITY_SPEED_MAX_KMH || 50);
    const HIGHWAY_SPEED = Number(process.env.HIGHWAY_SPEED_KMH || 80);
    const CITY_ZONES = [
      // Rough bounding boxes for major TZ cities: [latMin, lngMin, latMax, lngMax]
      { name: 'Dar', box: [-7.0, 39.15, -6.6, 39.40] },
      { name: 'Morogoro', box: [-6.92, 37.62, -6.75, 37.71] },
      { name: 'Dodoma', box: [-6.20, 35.67, -6.14, 35.79] },
      { name: 'Arusha', box: [-3.42, 36.58, -3.27, 36.76] },
      { name: 'Mwanza', box: [-2.60, 32.86, -2.40, 32.96] },
    ];
    const inCity = (lat: number, lng: number) => CITY_ZONES.some(z => lat >= z.box[0] && lat <= z.box[2] && lng >= z.box[1] && lng <= z.box[3]);
    const citySpeed = () => Math.min(CITY_SPEED_MAX, Math.max(CITY_SPEED_MIN, CITY_SPEED_MIN + Math.random() * (CITY_SPEED_MAX - CITY_SPEED_MIN)));
    const haversineMeters = (aLat: number, aLng: number, bLat: number, bLng: number) => {
      const toRad = (d: number) => d * Math.PI / 180;
      const R = 6371000;
      const dLat = toRad(bLat - aLat);
      const dLng = toRad(bLng - aLng);
      const A = Math.sin(dLat/2)**2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng/2)**2;
      const C = 2 * Math.atan2(Math.sqrt(A), Math.sqrt(1-A));
      return R * C;
    };
    
    // Defensive model access to handle case-sensitivity in generated Prisma client
    const shipmentModel = (db as any).Shipment || (db as any).shipment;
    const vehicleTrackingModel = (db as any).VehicleTracking || (db as any).vehicleTracking;
    const routeSegmentModel = (db as any).RouteSegment || (db as any).routeSegment;
    const trackingEventModel = (db as any).TrackingEvent || (db as any).trackingEvent;

    if (!shipmentModel || !vehicleTrackingModel || !routeSegmentModel) {
      console.warn('[TRACKING_GET] One or more models missing, degrading gracefully', {
        available: Object.keys(db || {}).filter(k => !k.startsWith('$'))
      });
      // Try to return minimal payload using shipment model if available
      if (shipmentModel) {
        const shipment = await shipmentModel.findFirst({
          where: { waybillNumber: { equals: normalized, mode: 'insensitive' } }
        });
        if (!shipment) {
          return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
        }
        const startCoords = getLocationCoords(shipment.origin) || { lat: -6.7924, lng: 39.2083 };
        const endCoords = getLocationCoords(shipment.destination) || { lat: -2.5164, lng: 32.9033 };
        const poly = await getRoadRoute(startCoords.lat, startCoords.lng, endCoords.lat, endCoords.lng);
        const cycle = 900000;
        const now = Date.now();
        const progress = ((now % cycle) / cycle);
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
          degraded: true
        });
      }
      // If even shipment model is missing, return a static but valid response
      return NextResponse.json({
        currentLat: -6.7924,
        currentLng: 39.2083,
        speed: 0,
        heading: 0,
        routePoints: [[-6.7924,39.2083],[-2.5164,32.9033]],
        isSimulated: true,
        serverTime: new Date().toISOString(),
        degraded: true
      });
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

      const poly = await getRoadRoute(startCoords.lat, startCoords.lng, endCoords.lat, endCoords.lng);

      const numSegments = 100;
      const segmentsData = [];
      for (let i = 0; i < poly.length - 1; i++) {
        const a = poly[i];
        const b = poly[i + 1];
        segmentsData.push({ startLat: a[0], startLng: a[1], endLat: b[0], endLng: b[1], isCompleted: false, order: i });
      }

      if (!tracking) {
        tracking = await vehicleTrackingModel.create({
          data: {
            shipmentId: shipment.id,
            currentLat: poly[0][0],
            currentLng: poly[0][1],
            speed: 35,
            heading: 0,
            segments: { create: segmentsData },
            routePoints: poly
          },
          include: { segments: { orderBy: { order: 'asc' } } }
        });
      } else {
        await vehicleTrackingModel.update({
          where: { id: tracking.id },
          data: { segments: { create: segmentsData }, routePoints: poly }
        });
        tracking = await vehicleTrackingModel.findUnique({
          where: { id: tracking.id },
          include: { segments: { orderBy: { order: 'asc' } } }
        });
      }
    }

    // MOVEMENT LOGIC
    if (tracking && (tracking as any).routePoints && Array.isArray((tracking as any).routePoints) && (tracking as any).routePoints.length > 1) {
      const poly: [number, number][] = (tracking as any).routePoints;
      const total = poly.length;
      let iClosest = 0;
      let minD = Infinity;
      for (let i = 0; i < total; i++) {
        const dLat = poly[i][0] - tracking.currentLat;
        const dLng = poly[i][1] - tracking.currentLng;
        const d = dLat * dLat + dLng * dLng;
        if (d < minD) { minD = d; iClosest = i; }
      }
      let targetIdx = Math.min(iClosest + 1, total - 1);
      const progressRatio = targetIdx / (total - 1);
      const near = poly[Math.max(0, Math.min(targetIdx, total - 1))];
      const isUrbanZone = inCity(near[0], near[1]) || progressRatio < 0.15 || progressRatio > 0.85;
      const baseTarget = isUrbanZone ? citySpeed() : HIGHWAY_SPEED;
      let turnFactor = 1;
      if (targetIdx > 0 && targetIdx < total - 1) {
        const p0 = poly[targetIdx - 1];
        const p1 = poly[targetIdx];
        const p2 = poly[targetIdx + 1];
        const v1x = p1[1] - p0[1], v1y = p1[0] - p0[0];
        const v2x = p2[1] - p1[1], v2y = p2[0] - p1[0];
        const dot = v1x * v2x + v1y * v2y;
        const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
        const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);
        if (mag1 > 0 && mag2 > 0) {
          const cosA = Math.min(1, Math.max(-1, dot / (mag1 * mag2)));
          const ang = Math.acos(cosA) * 180 / Math.PI;
          if (ang < 60) turnFactor = 0.5;
          else if (ang < 90) turnFactor = 0.7;
          else if (ang < 120) turnFactor = 0.85;
        }
      }
      const prevSpeed = typeof tracking.speed === 'number' ? tracking.speed : baseTarget;
      const accel = Number(process.env.SPEED_ACCEL_KMHPS || 8);
      const decel = Number(process.env.SPEED_DECEL_KMHPS || 12);
      const nowTs = Date.now();
      const last = tracking.lastUpdated ? new Date(tracking.lastUpdated as any).getTime() : nowTs;
      const deltaSec = Math.max(1, Math.min(2, (nowTs - last) / 1000));
      const desired = Math.max(5, baseTarget * turnFactor);
      const maxUp = prevSpeed + accel * deltaSec;
      const maxDown = prevSpeed - decel * deltaSec;
      const clamped = Math.min(maxUp, Math.max(maxDown, desired));
      let distToTravel = (clamped * 1000 / 3600) * deltaSec;
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
        const segLen = haversineMeters(aLat, aLng, bLat, bLng);
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
      const hdy = poly[Math.min(targetIdx, total - 1)][0] - curLat;
      const hdx = poly[Math.min(targetIdx, total - 1)][1] - curLng;
      const heading = (Math.atan2(hdx, hdy) * 180) / Math.PI;
      const actualSpeed = Math.max(0, (traveled / deltaSec) * 3.6);
      tracking = await vehicleTrackingModel.update({
        where: { id: tracking.id },
        data: { currentLat: curLat, currentLng: curLng, speed: actualSpeed, heading, lastUpdated: new Date() },
        include: { segments: { orderBy: { order: 'asc' } } }
      });
      const dest = poly[poly.length - 1];
      const remain = haversineMeters(curLat, curLng, dest[0], dest[1]);
      if (remain < 50) {
        try {
          if (shipment.currentStatus !== 'DELIVERED') {
            await shipmentModel.update({ where: { id: shipment.id }, data: { currentStatus: 'DELIVERED' } });
            if (trackingEventModel) {
              await trackingEventModel.create({
              data: {
                shipmentId: shipment.id,
                status: 'DELIVERED',
                location: `${dest[0].toFixed(5)},${dest[1].toFixed(5)}`
              }
              });
            }
          }
        } catch {}
      }
    } else if (tracking && tracking.segments && tracking.segments.length > 0) {
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

        const progress = (tracking.segments.length - incompleteSegments.length) / tracking.segments.length;
        const isUrban = progress < 0.2 || progress > 0.8;
        const nearLat = tracking.currentLat, nearLng = tracking.currentLng;
        const baseTarget = (inCity(nearLat, nearLng) || isUrban) ? citySpeed() : HIGHWAY_SPEED;
        const prevSpeed = typeof tracking.speed === 'number' ? tracking.speed : baseTarget;
        const accel = Number(process.env.SPEED_ACCEL_KMHPS || 8);
        const decel = Number(process.env.SPEED_DECEL_KMHPS || 12);
        const nowTs = Date.now();
        const last = tracking.lastUpdated ? new Date(tracking.lastUpdated as any).getTime() : nowTs;
        const deltaSec = Math.max(1, Math.min(2, (nowTs - last) / 1000));
        const desired = Math.max(5, baseTarget);
        const maxUp = prevSpeed + accel * deltaSec;
        const maxDown = prevSpeed - decel * deltaSec;
        const targetSpeed = Math.min(maxUp, Math.max(maxDown, desired));
        const distMeters = (targetSpeed * 1000 / 3600) * deltaSec;
        const dist = haversineMeters(tracking.currentLat, tracking.currentLng, nextSegment.endLat, nextSegment.endLng);
        let newLat = tracking.currentLat;
        let newLng = tracking.currentLng;
        if (dist > 0) {
          const ratio = Math.min(1, distMeters / dist);
          newLat += dy * ratio;
          newLng += dx * ratio;
        }

        const distanceToEnd = Math.sqrt(Math.pow(nextSegment.endLat - newLat, 2) + Math.pow(nextSegment.endLng - newLng, 2));
        
        const actualSpeed = Math.max(0, (Math.min(dist, distMeters) / deltaSec) * 3.6);
        const updateData: any = {
          currentLat: newLat,
          currentLng: newLng,
          speed: actualSpeed,
          heading: heading,
          lastUpdated: new Date()
        };

        if (distanceToEnd < 0.005) { 
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
    } else if (tracking) {
      // SEGMENT-LESS FALLBACK: move in a straight line towards destination
      const startCoords = getLocationCoords(shipment.origin) || { lat: -6.7924, lng: 39.2083 };
      const endCoords = getLocationCoords(shipment.destination) || { lat: -2.5164, lng: 32.9033 };

      const dy = endCoords.lat - tracking.currentLat;
      const dx = endCoords.lng - tracking.currentLng;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const heading = (Math.atan2(dx, dy) * 180) / Math.PI;
      const baseTarget = inCity(tracking.currentLat, tracking.currentLng) ? citySpeed() : HIGHWAY_SPEED;
      const prevSpeed = typeof tracking.speed === 'number' ? tracking.speed : baseTarget;
      const accel = Number(process.env.SPEED_ACCEL_KMHPS || 8);
      const decel = Number(process.env.SPEED_DECEL_KMHPS || 12);
      const nowTs = Date.now();
      const last = tracking.lastUpdated ? new Date(tracking.lastUpdated as any).getTime() : nowTs;
      const deltaSec = Math.max(1, Math.min(2, (nowTs - last) / 1000));
      const desired = Math.max(5, baseTarget);
      const maxUp = prevSpeed + accel * deltaSec;
      const maxDown = prevSpeed - decel * deltaSec;
      const targetSpeed = Math.min(maxUp, Math.max(maxDown, desired));
      const distMeters = (targetSpeed * 1000 / 3600) * deltaSec;
      const metersPerDegLat = 111320;
      const metersPerDegLng = 111320 * Math.cos((tracking.currentLat * Math.PI) / 180);
      const stepLat = (dy / Math.sqrt(dy*dy + dx*dx)) * (distMeters / metersPerDegLat);
      const stepLng = (dx / Math.sqrt(dy*dy + dx*dx)) * (distMeters / metersPerDegLng || distMeters / metersPerDegLat);

      const newLat = tracking.currentLat + stepLat;
      const newLng = tracking.currentLng + stepLng;

      const actualSpeed = Math.max(0, (distMeters / deltaSec) * 3.6);
      tracking = await vehicleTrackingModel.update({
        where: { id: tracking.id },
        data: {
          currentLat: newLat,
          currentLng: newLng,
          speed: actualSpeed,
          heading,
          lastUpdated: new Date()
        },
        include: { segments: { orderBy: { order: 'asc' } } }
      });
    }

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
        segmentsData.push({ startLat: sLat, startLng: sLng, endLat: eLat, endLng: eLng, isCompleted: false, order: i });
      }
      payload = { ...payload, segments: segmentsData };
    }
    return NextResponse.json({ ...payload, isSimulated: true, serverTime: new Date().toISOString() });

  } catch (error) {
    console.error('[TRACKING_GET]', error);
    try {
      // Attempt a graceful fallback to avoid 500s breaking the UI
      const { searchParams } = new URL(req.url);
      const waybillNumber = searchParams.get('waybillNumber') || '';
      const normalized = waybillNumber.trim();
      const shipmentModel = (db as any).Shipment || (db as any).shipment;
      if (shipmentModel && normalized) {
        const shipment = await shipmentModel.findFirst({
          where: { waybillNumber: { equals: normalized, mode: 'insensitive' } }
        });
        if (shipment) {
          const startCoords = getLocationCoords(shipment.origin) || { lat: -6.7924, lng: 39.2083 };
          return NextResponse.json({
            currentLat: startCoords.lat,
            currentLng: startCoords.lng,
            speed: 0,
            heading: 0,
            segments: [],
            isSimulated: true,
            serverTime: new Date().toISOString(),
            fallback: true
          });
        }
      }
    } catch (fallbackError) {
      console.error('[TRACKING_GET_FALLBACK_FAILED]', fallbackError);
    }
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

    // Update shipment status if it's not DELIVERED
    if (shipment.currentStatus !== 'DELIVERED') {
      await shipmentModel.update({
        where: { id: shipment.id },
        data: { currentStatus: status }
      });
    }

    // Create tracking event
    const event = await trackingEventModel.create({
      data: {
        shipmentId: shipment.id,
        status: status,
        location: location || 'Unknown',
        remarks: remarks || `Shipment is ${status.toLowerCase().replace('_', ' ')}`,
        timestamp: new Date()
      }
    });

    // Update vehicle tracking position if location is recognized
    if (location && vehicleTrackingModel) {
      const coords = getLocationCoords(location);
      if (coords) {
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
      }
    }

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('[TRACKING_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
