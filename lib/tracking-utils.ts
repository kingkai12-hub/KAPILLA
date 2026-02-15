/**
 * Tracking System Utility Functions
 * Pure functions for calculations and transformations
 */

import { EARTH, CITY_ZONES, SPEED, TURN_FACTORS } from './tracking-constants';
import type { LatLng, SpeedCalculationParams } from './tracking-types';

/**
 * Calculate distance between two points using Haversine formula
 * @returns Distance in meters
 */
export function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = EARTH.RADIUS_METERS;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const A =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  const C = 2 * Math.atan2(Math.sqrt(A), Math.sqrt(1 - A));
  return R * C;
}

/**
 * Check if coordinates are within a city zone
 */
export function isInCity(lat: number, lng: number): boolean {
  return CITY_ZONES.some(
    (z) => lat >= z.box[0] && lat <= z.box[2] && lng >= z.box[1] && lng <= z.box[3]
  );
}

/**
 * Get random city speed within configured range
 */
export function getCitySpeed(): number {
  return Math.min(
    SPEED.CITY_MAX,
    Math.max(SPEED.CITY_MIN, SPEED.CITY_MIN + Math.random() * (SPEED.CITY_MAX - SPEED.CITY_MIN))
  );
}

/**
 * Calculate heading (bearing) from point A to point B
 * @returns Heading in degrees (0-360)
 */
export function calculateHeading(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number {
  const dy = toLat - fromLat;
  const dx = toLng - fromLng;

  // Handle identical points
  if (Math.abs(dy) < 1e-10 && Math.abs(dx) < 1e-10) {
    return 0;
  }

  const heading = (Math.atan2(dx, dy) * 180) / Math.PI;
  return (heading + 360) % 360; // Normalize to 0-360
}

/**
 * Calculate turn factor based on angle between two vectors
 * @returns Speed reduction factor (0.5 to 1.0)
 */
export function calculateTurnFactor(p0: LatLng, p1: LatLng, p2: LatLng): number {
  const v1x = p1[1] - p0[1];
  const v1y = p1[0] - p0[0];
  const v2x = p2[1] - p1[1];
  const v2y = p2[0] - p1[0];

  const dot = v1x * v2x + v1y * v2y;
  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);

  if (mag1 === 0 || mag2 === 0) return 1.0;

  const cosA = Math.min(1, Math.max(-1, dot / (mag1 * mag2)));
  const angleDeg = (Math.acos(cosA) * 180) / Math.PI;

  // Determine factor based on angle
  if (angleDeg < TURN_FACTORS.SHARP.angle) return TURN_FACTORS.SHARP.factor;
  if (angleDeg < TURN_FACTORS.MEDIUM.angle) return TURN_FACTORS.MEDIUM.factor;
  if (angleDeg < TURN_FACTORS.GENTLE.angle) return TURN_FACTORS.GENTLE.factor;
  return TURN_FACTORS.STRAIGHT.factor;
}

/**
 * Calculate new speed with acceleration/deceleration limits
 */
export function calculateSpeed(params: SpeedCalculationParams): number {
  const { currentSpeed, targetSpeed, deltaSeconds, isAccelerating } = params;

  const accelRate = isAccelerating ? SPEED.ACCEL_KMHPS : SPEED.DECEL_KMHPS;
  const maxChange = accelRate * deltaSeconds;

  const diff = targetSpeed - currentSpeed;
  const change = Math.sign(diff) * Math.min(Math.abs(diff), maxChange);

  const newSpeed = currentSpeed + change;
  return Math.max(SPEED.MIN_SPEED, Math.min(SPEED.MAX_SPEED, newSpeed));
}

/**
 * Find closest point index on a route
 */
export function findClosestPointIndex(route: LatLng[], lat: number, lng: number): number {
  let minD = Infinity;
  let idx = 0;

  for (let i = 0; i < route.length; i++) {
    const dLat = route[i][0] - lat;
    const dLng = route[i][1] - lng;
    const d = dLat * dLat + dLng * dLng;
    if (d < minD) {
      minD = d;
      idx = i;
    }
  }

  return idx;
}

/**
 * Sample route points for efficient rendering
 * @param route Full route with all points
 * @param maxPoints Maximum points to return
 * @returns Sampled route with first, last, and evenly distributed points
 */
export function sampleRoute(route: LatLng[], maxPoints: number = 300): LatLng[] {
  if (route.length <= maxPoints) return route;

  const step = Math.max(1, Math.floor(route.length / maxPoints));
  const sampled: LatLng[] = [];

  for (let i = 0; i < route.length; i += step) {
    sampled.push(route[i]);
  }

  // Always include last point
  const last = route[route.length - 1];
  const tail = sampled[sampled.length - 1];
  if (!tail || tail[0] !== last[0] || tail[1] !== last[1]) {
    sampled.push(last);
  }

  return sampled;
}

/**
 * Split route into completed and remaining segments based on current position
 */
export function splitRouteAtPosition(
  route: LatLng[],
  currentLat: number,
  currentLng: number
): { completed: LatLng[]; remaining: LatLng[] } {
  const idx = findClosestPointIndex(route, currentLat, currentLng);

  return {
    completed: route.slice(0, Math.max(1, idx + 1)),
    remaining: route.slice(Math.max(0, idx), route.length),
  };
}

/**
 * Check if vehicle has reached destination
 */
export function hasReachedDestination(
  currentLat: number,
  currentLng: number,
  destLat: number,
  destLng: number
): boolean {
  const DESTINATION_ARRIVAL = 50; // meters
  const distance = haversineMeters(currentLat, currentLng, destLat, destLng);
  return distance < DESTINATION_ARRIVAL;
}

/**
 * Check if segment is completed
 */
export function isSegmentCompleted(
  currentLat: number,
  currentLng: number,
  endLat: number,
  endLng: number
): boolean {
  const SEGMENT_COMPLETION = 50; // meters
  const distance = haversineMeters(currentLat, currentLng, endLat, endLng);
  return distance < SEGMENT_COMPLETION;
}

/**
 * Interpolate between two points
 * @param from Starting point
 * @param to Ending point
 * @param ratio Interpolation ratio (0 to 1)
 * @returns Interpolated point
 */
export function interpolatePoint(from: LatLng, to: LatLng, ratio: number): LatLng {
  const clampedRatio = Math.max(0, Math.min(1, ratio));
  return [from[0] + (to[0] - from[0]) * clampedRatio, from[1] + (to[1] - from[1]) * clampedRatio];
}

/**
 * Calculate total route distance
 * @returns Distance in meters
 */
export function calculateRouteDistance(route: LatLng[]): number {
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    total += haversineMeters(route[i][0], route[i][1], route[i + 1][0], route[i + 1][1]);
  }
  return total;
}

/**
 * Determine if location is urban based on progress and coordinates
 */
export function isUrbanLocation(lat: number, lng: number, progressRatio: number): boolean {
  return isInCity(lat, lng) || progressRatio < 0.15 || progressRatio > 0.85;
}

/**
 * Validate coordinates
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate time delta in seconds with safety bounds
 */
export function calculateTimeDelta(lastUpdated: Date | null): number {
  const now = Date.now();
  const last = lastUpdated ? new Date(lastUpdated).getTime() : now;
  const deltaSec = (now - last) / 1000;
  return Math.max(1, Math.min(2, deltaSec)); // Clamp between 1-2 seconds
}
