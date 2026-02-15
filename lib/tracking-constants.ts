/**
 * Tracking System Constants
 * Centralized configuration for vehicle tracking and simulation
 */

// Speed Configuration (km/h)
export const SPEED = {
  CITY_MIN: Number(process.env.CITY_SPEED_MIN_KMH) || 20,
  CITY_MAX: Number(process.env.CITY_SPEED_MAX_KMH) || 50,
  HIGHWAY: Number(process.env.HIGHWAY_SPEED_KMH) || 80,
  ACCEL_KMHPS: Number(process.env.SPEED_ACCEL_KMHPS) || 8,
  DECEL_KMHPS: Number(process.env.SPEED_DECEL_KMHPS) || 12,
  MIN_SPEED: 5, // Minimum speed to avoid stopping
  MAX_SPEED: 120, // Maximum realistic speed
} as const;

// Distance Thresholds (meters)
export const DISTANCE = {
  SEGMENT_COMPLETION: 50, // Distance to consider segment complete
  DESTINATION_ARRIVAL: 50, // Distance to mark as delivered
  TURN_DETECTION: 100, // Distance for turn detection
} as const;

// Route Configuration
export const ROUTE = {
  MAX_SEGMENTS: 100, // Maximum route segments
  SAMPLE_STEP: 300, // Route sampling for display (every Nth point)
  MIN_POINTS: 2, // Minimum points for valid route
} as const;

// Cache Configuration
export const CACHE = {
  OSRM_TTL_MS: Number(process.env.OSRM_TTL_MS) || 21600000, // 6 hours
  MAX_CACHE_SIZE: 1000, // Maximum cached routes
} as const;

// Update Intervals (milliseconds)
export const INTERVALS = {
  SSE_UPDATE: 1000, // SSE update frequency
  POLL_FALLBACK: 1000, // Polling fallback frequency
  SSE_KEEPALIVE: 15000, // SSE keep-alive ping
  ANIMATION_FRAME: 16, // ~60fps for smooth animation
  SSE_RETRY_DELAY: 600, // Delay before starting polling
} as const;

// Map Configuration
export const MAP = {
  DEFAULT_ZOOM: 16,
  URBAN_ZOOM: 16,
  HIGHWAY_ZOOM: 14,
  MIN_ZOOM: 13,
  MARKER_SIZE: 36,
  ROUTE_WEIGHT_COMPLETED: 8,
  ROUTE_WEIGHT_REMAINING: 6,
} as const;

// City Zones (bounding boxes: [latMin, lngMin, latMax, lngMax])
export const CITY_ZONES = [
  { name: 'Dar es Salaam', box: [-7.0, 39.15, -6.6, 39.4] },
  { name: 'Morogoro', box: [-6.92, 37.62, -6.75, 37.71] },
  { name: 'Dodoma', box: [-6.2, 35.67, -6.14, 35.79] },
  { name: 'Arusha', box: [-3.42, 36.58, -3.27, 36.76] },
  { name: 'Mwanza', box: [-2.6, 32.86, -2.4, 32.96] },
  { name: 'Mbeya', box: [-9.0, 33.3, -8.8, 33.6] },
  { name: 'Tanga', box: [-5.2, 38.9, -5.0, 39.2] },
] as const;

// Turn Speed Factors (based on angle)
export const TURN_FACTORS = {
  SHARP: { angle: 60, factor: 0.5 }, // Sharp turn
  MEDIUM: { angle: 90, factor: 0.7 }, // Medium turn
  GENTLE: { angle: 120, factor: 0.85 }, // Gentle turn
  STRAIGHT: { angle: 180, factor: 1.0 }, // Straight
} as const;

// Progress Thresholds
export const PROGRESS = {
  URBAN_START: 0.15, // First 15% is urban
  URBAN_END: 0.85, // Last 15% is urban
} as const;

// Earth Constants
export const EARTH = {
  RADIUS_METERS: 6371000,
  METERS_PER_DEG_LAT: 111320,
} as const;

// API Configuration
export const API = {
  OSRM_BASE_URL: 'https://router.project-osrm.org/route/v1/driving',
  REQUEST_TIMEOUT: 10000, // 10 seconds
  MAX_RETRIES: 3,
} as const;

// Simulation Configuration
export const SIMULATION = {
  DEFAULT_CYCLE_MS: 3600000, // 1 hour for full route
  MIN_CYCLE_MS: 3600000, // Minimum cycle time
  TARGET_SPEED_KMH: 65, // Target average speed
} as const;

// Error Messages
export const ERRORS = {
  WAYBILL_REQUIRED: 'Waybill number is required',
  SHIPMENT_NOT_FOUND: 'Shipment not found',
  TRACKING_NOT_FOUND: 'Tracking not found',
  MODELS_NOT_INITIALIZED: 'Database models not initialized',
  INTERNAL_ERROR: 'Internal Server Error',
  CONNECTION_ISSUE: 'Connection issue. Retrying...',
  NO_SIGNAL: 'No Signal Detected',
} as const;

// Status Messages
export const STATUS = {
  INITIALIZING: 'Initializing GPS...',
  SIGNAL_STRONG: 'Signal: Strong',
  ACTIVE: 'Active',
  URBAN_TRANSIT: '🏙️ Urban Transit Zone',
  HIGHWAY_CORRIDOR: '🛣️ Highway Corridor',
  VELOCITY_ALERT: '⚠️ Velocity Alert: High Speed',
} as const;

// Speed Alert Threshold
export const ALERTS = {
  HIGH_SPEED_THRESHOLD: 80, // km/h
} as const;
