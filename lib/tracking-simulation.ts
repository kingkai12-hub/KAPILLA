/**
 * Time-based, deterministic vehicle simulation.
 *
 * The whole point: the vehicle's position is a pure function of
 * (anchor position, anchor time, cruise speed, wall-clock time). Because the
 * maths only depends on the clock — not on anyone being online — the truck
 * keeps driving (and catches up to where it *should* be) the moment anybody
 * looks, no matter how long the system was idle.
 *
 * Nothing here talks to the database or the network; it is pure geometry so it
 * can be reused by the public tracking API, the background job and tests.
 */

export type LatLng = [number, number];

export interface RouteMetrics {
  points: LatLng[];
  /** Cumulative distance in meters at each point index. */
  cumulative: number[];
  totalMeters: number;
}

export interface SimAnchor {
  lat: number;
  lng: number;
  /** Epoch milliseconds when the vehicle was last snapped to (lat,lng). */
  atMs: number;
  /** Planned average speed for this journey, km/h. */
  cruiseKmh: number;
}

export interface SimState {
  lat: number;
  lng: number;
  heading: number;
  speedKmh: number;
  distanceAlong: number;
  totalMeters: number;
  remainingMeters: number;
  arrived: boolean;
}

export const DEFAULT_CRUISE_KMH = 70;

const EARTH_R = 6371000;
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

export function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return EARTH_R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Compass bearing (0-360) from point a to point b. */
export function bearing(a: LatLng, b: LatLng): number {
  const [lat1, lng1] = a;
  const [lat2, lng2] = b;
  const p1 = toRad(lat1);
  const p2 = toRad(lat2);
  const dl = toRad(lng2 - lng1);
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Coerce whatever is stored in `routePoints` (Prisma Json) into [lat,lng] pairs. */
export function normalizeRoutePoints(value: unknown): LatLng[] {
  if (!Array.isArray(value)) return [];
  const out: LatLng[] = [];
  for (const p of value) {
    if (Array.isArray(p) && p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1])) {
      out.push([Number(p[0]), Number(p[1])]);
    }
  }
  return out;
}

export function buildRouteMetrics(points: LatLng[]): RouteMetrics {
  const cumulative = [0];
  for (let i = 1; i < points.length; i++) {
    cumulative.push(
      cumulative[i - 1] +
        haversineMeters(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1])
    );
  }
  return { points, cumulative, totalMeters: cumulative[cumulative.length - 1] || 0 };
}

/**
 * Distance, in meters from the start of the route, to the closest point on the
 * route to (lat, lng). Used to snap an arbitrary location onto the route.
 */
export function distanceAlongRoute(metrics: RouteMetrics, lat: number, lng: number): number {
  const { points, cumulative } = metrics;
  if (points.length < 2) return 0;

  let best = Infinity;
  let bestDist = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const [aLat, aLng] = points[i];
    const [bLat, bLng] = points[i + 1];
    const segLen = cumulative[i + 1] - cumulative[i];
    const dx = bLng - aLng;
    const dy = bLat - aLat;
    const len2 = dx * dx + dy * dy;
    let t = 0;
    if (len2 > 0) {
      t = ((lng - aLng) * dx + (lat - aLat) * dy) / len2;
      t = Math.max(0, Math.min(1, t));
    }
    const pLat = aLat + dy * t;
    const pLng = aLng + dx * t;
    const d = haversineMeters(lat, lng, pLat, pLng);
    if (d < best) {
      best = d;
      bestDist = cumulative[i] + segLen * t;
    }
  }
  return bestDist;
}

/** Interpolated position (and heading) at a given distance from the route start. */
export function positionAtDistance(
  metrics: RouteMetrics,
  meters: number
): { lat: number; lng: number; heading: number } {
  const { points, cumulative, totalMeters } = metrics;
  if (points.length === 0) return { lat: 0, lng: 0, heading: 0 };
  if (points.length === 1) return { lat: points[0][0], lng: points[0][1], heading: 0 };

  const d = Math.max(0, Math.min(meters, totalMeters));

  let i = 0;
  while (i < cumulative.length - 2 && cumulative[i + 1] < d) i++;

  const segLen = cumulative[i + 1] - cumulative[i];
  const t = segLen > 0 ? (d - cumulative[i]) / segLen : 0;
  const a = points[i];
  const b = points[i + 1];

  return {
    lat: a[0] + (b[0] - a[0]) * t,
    lng: a[1] + (b[1] - a[1]) * t,
    heading: bearing(a, b),
  };
}

/** Planned average speed for a journey. Override with TRACKING_CRUISE_KMH. */
export function pickCruiseKmh(): number {
  const env = Number(process.env.TRACKING_CRUISE_KMH);
  if (Number.isFinite(env) && env > 0) return env;
  // Realistic Tanzanian trunk-road average: 60-85 km/h.
  return 60 + Math.random() * 25;
}

/** How long the whole route takes at the given cruise speed (seconds). */
export function durationSeconds(totalMeters: number, cruiseKmh: number): number {
  if (!(cruiseKmh > 0)) return 0;
  return totalMeters / ((cruiseKmh * 1000) / 3600);
}

/**
 * The heart of the simulation: where the vehicle is at `nowMs`, given where it
 * was snapped last (`anchor`) and how fast it cruises.
 */
export function computeSimulation(
  metrics: RouteMetrics,
  anchor: SimAnchor,
  nowMs: number
): SimState {
  const cruise = anchor.cruiseKmh > 0 ? anchor.cruiseKmh : DEFAULT_CRUISE_KMH;
  const startDist = distanceAlongRoute(metrics, anchor.lat, anchor.lng);
  const elapsedSec = Math.max(0, (nowMs - anchor.atMs) / 1000);
  const travelled = ((cruise * 1000) / 3600) * elapsedSec;

  const raw = startDist + travelled;
  const arrived = raw >= metrics.totalMeters;
  const target = Math.min(raw, metrics.totalMeters);
  const pos = positionAtDistance(metrics, target);

  return {
    lat: pos.lat,
    lng: pos.lng,
    heading: pos.heading,
    speedKmh: arrived ? 0 : cruise,
    distanceAlong: target,
    totalMeters: metrics.totalMeters,
    remainingMeters: Math.max(0, metrics.totalMeters - target),
    arrived,
  };
}
