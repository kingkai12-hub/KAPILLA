/**
 * Speed Manager - Realistic Vehicle Speed Simulation
 * 
 * Provides realistic speed behavior including:
 * - City zones: 20-50 km/h
 * - Highway zones: 60-90+ km/h
 * - Random speed variations (±5 km/h)
 * - Junction slowdowns
 * - Traffic simulation with stops
 * - Smooth acceleration/deceleration
 */

export interface SpeedConfig {
  // Speed limits
  citySpeedMin: number;      // 20 km/h
  citySpeedMax: number;      // 50 km/h
  highwaySpeedMin: number;   // 60 km/h
  highwaySpeedMax: number;   // 90 km/h
  
  // Acceleration
  accelRate: number;         // 8 km/h per second
  decelRate: number;         // 12 km/h per second
  
  // Variations
  speedVariation: number;    // ±5 km/h random
  
  // Traffic simulation
  enableTrafficStops: boolean;
  stopProbability: number;   // 0.02 = 2% chance per update
  stopDurationMin: number;   // 5 seconds
  stopDurationMax: number;   // 30 seconds
  
  // Junction behavior
  junctionSlowdownRadius: number;  // 100 meters
  junctionSlowdownFactor: number;  // 0.6 (60% of normal speed)
}

export interface CityZone {
  name: string;
  box: [number, number, number, number]; // [latMin, lngMin, latMax, lngMax]
}

export interface VehicleState {
  currentLat: number;
  currentLng: number;
  speed: number;
  heading: number;
  lastUpdated: Date;
  
  // Traffic simulation state
  isStopped?: boolean;
  stopUntil?: number;
  stopReason?: string;
  
  // Speed variation state
  speedVariationOffset?: number;
  lastVariationUpdate?: number;
}

export interface RouteContext {
  routePoints: [number, number][];
  currentIndex: number;
  totalDistance: number;
  remainingDistance: number;
  progressRatio: number;
}

/**
 * Default configuration
 */
export const DEFAULT_SPEED_CONFIG: SpeedConfig = {
  citySpeedMin: 20,
  citySpeedMax: 50,
  highwaySpeedMin: 60,
  highwaySpeedMax: 90,
  accelRate: 8,
  decelRate: 12,
  speedVariation: 5,
  enableTrafficStops: true,
  stopProbability: 0.02,
  stopDurationMin: 5,
  stopDurationMax: 30,
  junctionSlowdownRadius: 100,
  junctionSlowdownFactor: 0.6,
};

/**
 * Tanzania city zones
 */
export const TANZANIA_CITY_ZONES: CityZone[] = [
  { name: 'Dar es Salaam', box: [-7.0, 39.15, -6.6, 39.40] },
  { name: 'Morogoro', box: [-6.92, 37.62, -6.75, 37.71] },
  { name: 'Dodoma', box: [-6.20, 35.67, -6.14, 35.79] },
  { name: 'Arusha', box: [-3.42, 36.58, -3.27, 36.76] },
  { name: 'Mwanza', box: [-2.60, 32.86, -2.40, 32.96] },
  { name: 'Tanga', box: [-5.10, 39.05, -5.05, 39.12] },
  { name: 'Mbeya', box: [-8.92, 33.42, -8.88, 33.48] },
  { name: 'Iringa', box: [-7.79, 35.68, -7.75, 35.72] },
  { name: 'Tabora', box: [-5.03, 32.78, -4.99, 32.84] },
  { name: 'Kigoma', box: [-4.90, 29.60, -4.86, 29.66] },
];

/**
 * Check if location is in a city zone
 */
export function isInCity(lat: number, lng: number, zones: CityZone[] = TANZANIA_CITY_ZONES): boolean {
  return zones.some(z => 
    lat >= z.box[0] && lat <= z.box[2] && 
    lng >= z.box[1] && lng <= z.box[3]
  );
}

/**
 * Get city name if in city zone
 */
export function getCityName(lat: number, lng: number, zones: CityZone[] = TANZANIA_CITY_ZONES): string | null {
  const city = zones.find(z => 
    lat >= z.box[0] && lat <= z.box[2] && 
    lng >= z.box[1] && lng <= z.box[3]
  );
  return city?.name || null;
}

/**
 * Calculate distance between two points (Haversine formula)
 */
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => deg * Math.PI / 180;
  const R = 6371000; // Earth radius in meters
  
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
}

/**
 * Detect if near a junction (sharp angle in route)
 */
export function isNearJunction(
  routePoints: [number, number][],
  currentIndex: number,
  currentLat: number,
  currentLng: number,
  radius: number = 100
): boolean {
  if (currentIndex < 1 || currentIndex >= routePoints.length - 1) return false;
  
  // Check if there's a sharp turn ahead
  const lookAhead = Math.min(currentIndex + 5, routePoints.length - 1);
  
  for (let i = currentIndex; i < lookAhead - 1; i++) {
    const p0 = routePoints[i];
    const p1 = routePoints[i + 1];
    const p2 = routePoints[i + 2];
    
    // Calculate angle between segments
    const v1x = p1[1] - p0[1];
    const v1y = p1[0] - p0[0];
    const v2x = p2[1] - p1[1];
    const v2y = p2[0] - p1[0];
    
    const dot = v1x * v2x + v1y * v2y;
    const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
    const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);
    
    if (mag1 > 0 && mag2 > 0) {
      const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
      const angle = Math.acos(cosAngle) * 180 / Math.PI;
      
      // Sharp turn detected (< 120 degrees)
      if (angle < 120) {
        const distToJunction = haversineDistance(currentLat, currentLng, p1[0], p1[1]);
        if (distToJunction < radius) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Calculate base target speed based on location and route context
 */
export function calculateBaseSpeed(
  lat: number,
  lng: number,
  routeContext: RouteContext,
  config: SpeedConfig = DEFAULT_SPEED_CONFIG
): number {
  const inCityZone = isInCity(lat, lng);
  
  // City speed
  if (inCityZone) {
    return config.citySpeedMin + Math.random() * (config.citySpeedMax - config.citySpeedMin);
  }
  
  // Start/end of route (likely near cities)
  if (routeContext.progressRatio < 0.15 || routeContext.progressRatio > 0.85) {
    return config.citySpeedMin + Math.random() * (config.citySpeedMax - config.citySpeedMin);
  }
  
  // Highway speed
  return config.highwaySpeedMin + Math.random() * (config.highwaySpeedMax - config.highwaySpeedMin);
}

/**
 * Apply speed variation (±5 km/h random fluctuation)
 */
export function applySpeedVariation(
  baseSpeed: number,
  state: VehicleState,
  config: SpeedConfig = DEFAULT_SPEED_CONFIG
): number {
  const now = Date.now();
  
  // Update variation every 10 seconds
  if (!state.lastVariationUpdate || now - state.lastVariationUpdate > 10000) {
    state.speedVariationOffset = (Math.random() - 0.5) * 2 * config.speedVariation;
    state.lastVariationUpdate = now;
  }
  
  return baseSpeed + (state.speedVariationOffset || 0);
}

/**
 * Apply junction slowdown
 */
export function applyJunctionSlowdown(
  targetSpeed: number,
  routePoints: [number, number][],
  currentIndex: number,
  currentLat: number,
  currentLng: number,
  config: SpeedConfig = DEFAULT_SPEED_CONFIG
): number {
  if (isNearJunction(routePoints, currentIndex, currentLat, currentLng, config.junctionSlowdownRadius)) {
    return targetSpeed * config.junctionSlowdownFactor;
  }
  return targetSpeed;
}

/**
 * Check and handle traffic stops
 */
export function handleTrafficStop(
  state: VehicleState,
  config: SpeedConfig = DEFAULT_SPEED_CONFIG
): boolean {
  const now = Date.now();
  
  // Check if currently stopped
  if (state.isStopped && state.stopUntil) {
    if (now < state.stopUntil) {
      return true; // Still stopped
    } else {
      // Stop duration ended
      state.isStopped = false;
      state.stopUntil = undefined;
      state.stopReason = undefined;
      return false;
    }
  }
  
  // Random chance to stop (traffic simulation)
  if (config.enableTrafficStops && Math.random() < config.stopProbability) {
    const stopDuration = config.stopDurationMin + 
                        Math.random() * (config.stopDurationMax - config.stopDurationMin);
    
    state.isStopped = true;
    state.stopUntil = now + stopDuration * 1000;
    state.stopReason = Math.random() > 0.5 ? 'Traffic light' : 'Traffic congestion';
    
    return true;
  }
  
  return false;
}

/**
 * Calculate target speed with all factors applied
 */
export function calculateTargetSpeed(
  currentLat: number,
  currentLng: number,
  routeContext: RouteContext,
  state: VehicleState,
  config: SpeedConfig = DEFAULT_SPEED_CONFIG
): { targetSpeed: number; reason: string } {
  // Check for traffic stop
  if (handleTrafficStop(state, config)) {
    return { targetSpeed: 0, reason: state.stopReason || 'Stopped' };
  }
  
  // Calculate base speed
  let targetSpeed = calculateBaseSpeed(currentLat, currentLng, routeContext, config);
  let reason = isInCity(currentLat, currentLng) ? 'City zone' : 'Highway';
  
  // Apply speed variation
  targetSpeed = applySpeedVariation(targetSpeed, state, config);
  
  // Apply junction slowdown
  const beforeJunction = targetSpeed;
  targetSpeed = applyJunctionSlowdown(
    targetSpeed,
    routeContext.routePoints,
    routeContext.currentIndex,
    currentLat,
    currentLng,
    config
  );
  
  if (targetSpeed < beforeJunction) {
    reason = 'Junction ahead';
  }
  
  // Ensure minimum speed
  targetSpeed = Math.max(5, targetSpeed);
  
  return { targetSpeed, reason };
}

/**
 * Apply smooth acceleration/deceleration
 */
export function applySmoothAcceleration(
  currentSpeed: number,
  targetSpeed: number,
  deltaSeconds: number,
  config: SpeedConfig = DEFAULT_SPEED_CONFIG
): number {
  const speedDiff = targetSpeed - currentSpeed;
  
  if (Math.abs(speedDiff) < 1) {
    return targetSpeed; // Close enough
  }
  
  if (speedDiff > 0) {
    // Accelerate
    const maxIncrease = config.accelRate * deltaSeconds;
    return currentSpeed + Math.min(speedDiff, maxIncrease);
  } else {
    // Decelerate
    const maxDecrease = config.decelRate * deltaSeconds;
    return currentSpeed + Math.max(speedDiff, -maxDecrease);
  }
}

/**
 * Calculate distance traveled based on speed
 */
export function calculateDistanceTraveled(
  speed: number,
  deltaSeconds: number
): number {
  // Distance = (speed in km/h * 1000 m/km) / (3600 s/h) * seconds
  return (speed * 1000 / 3600) * deltaSeconds;
}

/**
 * Main speed calculation function
 * Returns new speed and distance to travel
 */
export function calculateMovement(
  state: VehicleState,
  routeContext: RouteContext,
  config: SpeedConfig = DEFAULT_SPEED_CONFIG
): {
  newSpeed: number;
  distanceToTravel: number;
  reason: string;
  isStopped: boolean;
} {
  const now = Date.now();
  const lastUpdate = state.lastUpdated.getTime();
  const deltaSeconds = Math.max(1, Math.min(2, (now - lastUpdate) / 1000));
  
  // Calculate target speed with all factors
  const { targetSpeed, reason } = calculateTargetSpeed(
    state.currentLat,
    state.currentLng,
    routeContext,
    state,
    config
  );
  
  // Apply smooth acceleration/deceleration
  const newSpeed = applySmoothAcceleration(
    state.speed,
    targetSpeed,
    deltaSeconds,
    config
  );
  
  // Calculate distance to travel
  const distanceToTravel = calculateDistanceTraveled(newSpeed, deltaSeconds);
  
  return {
    newSpeed,
    distanceToTravel,
    reason,
    isStopped: state.isStopped || false,
  };
}

/**
 * Get speed zone description
 */
export function getSpeedZoneDescription(
  lat: number,
  lng: number,
  speed: number
): string {
  const cityName = getCityName(lat, lng);
  
  if (cityName) {
    return `${cityName} (${speed.toFixed(0)} km/h)`;
  }
  
  if (speed < 55) {
    return `Urban area (${speed.toFixed(0)} km/h)`;
  } else if (speed < 75) {
    return `Rural road (${speed.toFixed(0)} km/h)`;
  } else {
    return `Highway (${speed.toFixed(0)} km/h)`;
  }
}
