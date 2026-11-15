import { describe, it, expect } from 'vitest';
import {
  buildRouteMetrics,
  computeSimulation,
  distanceAlongRoute,
  durationSeconds,
  haversineMeters,
  normalizeRoutePoints,
  pickCruiseKmh,
  positionAtDistance,
  type LatLng,
} from '@/lib/tracking-simulation';

// A straight 3-point route (~11 km) so the geometry is easy to reason about.
const ROUTE: LatLng[] = [
  [-6.8, 39.2],
  [-6.8, 39.25],
  [-6.8, 39.3],
];

const metrics = buildRouteMetrics(ROUTE);
const T0 = Date.UTC(2026, 0, 1, 6, 0, 0);

describe('tracking simulation (time-based)', () => {
  it('builds cumulative route metrics', () => {
    expect(metrics.points).toHaveLength(3);
    expect(metrics.cumulative).toHaveLength(3);
    expect(metrics.cumulative[0]).toBe(0);
    expect(metrics.totalMeters).toBeGreaterThan(10000);
  });

  it('measures position by distance, not by point index', () => {
    const half = positionAtDistance(metrics, metrics.totalMeters / 2);
    expect(distanceAlongRoute(metrics, half.lat, half.lng)).toBeCloseTo(
      metrics.totalMeters / 2,
      -1
    );
  });

  it('moves the vehicle purely from the clock, with nobody online', () => {
    const anchor = { lat: ROUTE[0][0], lng: ROUTE[0][1], atMs: T0, cruiseKmh: 70 };
    const after5min = computeSimulation(metrics, anchor, T0 + 300 * 1000);

    // 70 km/h for 300 s == 5833 m covered, no input from any browser session.
    expect(after5min.distanceAlong).toBeCloseTo((70 * 1000 * 300) / 3600, -1);
    expect(after5min.speedKmh).toBe(70);
    expect(after5min.arrived).toBe(false);
    expect(after5min.remainingMeters).toBeGreaterThan(0);
  });

  it('takes exactly distance / speed to complete the journey', () => {
    const cruise = 80;
    const secs = durationSeconds(metrics.totalMeters, cruise);
    expect(secs).toBeCloseTo(metrics.totalMeters / ((cruise * 1000) / 3600), 6);

    const anchor = { lat: ROUTE[0][0], lng: ROUTE[0][1], atMs: T0, cruiseKmh: cruise };
    expect(computeSimulation(metrics, anchor, T0 + (secs - 1) * 1000).arrived).toBe(false);
    expect(computeSimulation(metrics, anchor, T0 + secs * 1000 + 1).arrived).toBe(true);
  });

  it('catches up to the destination even after a long offline gap', () => {
    const anchor = { lat: ROUTE[0][0], lng: ROUTE[0][1], atMs: T0, cruiseKmh: 70 };
    const week = computeSimulation(metrics, anchor, T0 + 7 * 24 * 3600 * 1000);

    expect(week.arrived).toBe(true);
    expect(week.speedKmh).toBe(0);
    expect(week.remainingMeters).toBe(0);
    expect(week.lat).toBeCloseTo(ROUTE[2][0], 6);
    expect(week.lng).toBeCloseTo(ROUTE[2][1], 6);
  });

  it('snaps instantly to a new staff-reported anchor, forwards or backwards', () => {
    // Staff report the vehicle at the far end while it was still at the start.
    const jumpedForward = computeSimulation(
      metrics,
      { lat: ROUTE[2][0], lng: ROUTE[2][1], atMs: T0, cruiseKmh: 70 },
      T0
    );
    expect(jumpedForward.lat).toBeCloseTo(ROUTE[2][0], 6);
    expect(jumpedForward.distanceAlong).toBeCloseTo(metrics.totalMeters, -1);

    // Staff report it behind where the clock had already carried it -> jumps back.
    const jumpedBack = computeSimulation(
      metrics,
      { lat: ROUTE[0][0], lng: ROUTE[0][1], atMs: T0 + 3600 * 1000, cruiseKmh: 70 },
      T0 + 3600 * 1000
    );
    expect(jumpedBack.distanceAlong).toBeCloseTo(0, -1);
    expect(jumpedBack.arrived).toBe(false);
  });

  it('projects an off-route village onto the nearest point of the route', () => {
    // 0.1° north of the route's midpoint.
    const state = computeSimulation(
      metrics,
      { lat: -6.9, lng: 39.25, atMs: T0, cruiseKmh: 70 },
      T0
    );
    expect(Math.abs(state.distanceAlong - metrics.totalMeters / 2)).toBeLessThan(50);
    expect(state.lat).toBeCloseTo(-6.8, 6);
  });

  it('normalizes raw routePoints payloads from Prisma Json', () => {
    expect(
      normalizeRoutePoints([
        [1, 2],
        [3, 4],
      ])
    ).toEqual([
      [1, 2],
      [3, 4],
    ]);
    expect(normalizeRoutePoints(null)).toEqual([]);
    expect(
      normalizeRoutePoints([
        [1, 2],
        ['x', 4],
        [5, 6],
      ])
    ).toEqual([
      [1, 2],
      [5, 6],
    ]);
  });

  it('honours TRACKING_CRUISE_KMH and otherwise uses a realistic 60-85 km/h', () => {
    process.env.TRACKING_CRUISE_KMH = '90';
    expect(pickCruiseKmh()).toBe(90);
    delete process.env.TRACKING_CRUISE_KMH;

    for (let i = 0; i < 25; i++) {
      const speed = pickCruiseKmh();
      expect(speed).toBeGreaterThanOrEqual(60);
      expect(speed).toBeLessThanOrEqual(85);
    }
  });

  it('measures the expected haversine distance', () => {
    // One degree of longitude at the equator is ~111.3 km.
    expect(haversineMeters(0, 0, 0, 1)).toBeGreaterThan(111000);
    expect(haversineMeters(0, 0, 0, 1)).toBeLessThan(111500);
  });
});
