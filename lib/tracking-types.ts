/**
 * TypeScript Types for Tracking System
 */

export type LatLng = [number, number];

export interface LocationCoords {
  lat: number;
  lng: number;
}

export interface RouteSegmentData {
  id: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  isCompleted: boolean;
  order: number;
}

export interface TrackingData {
  currentLat: number;
  currentLng: number;
  speed: number;
  heading: number;
  isSimulated?: boolean;
  serverTime?: string;
  routePoints?: LatLng[];
  segments: RouteSegmentData[];
  degraded?: boolean;
  fallback?: boolean;
}

export interface CityZone {
  name: string;
  box: [number, number, number, number]; // [latMin, lngMin, latMax, lngMax]
}

export interface CachedRoute {
  pts: LatLng[];
  t: number; // timestamp
}

export interface MovementResult {
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  segmentCompleted?: boolean;
}

export interface SpeedCalculationParams {
  currentSpeed: number;
  targetSpeed: number;
  deltaSeconds: number;
  isAccelerating: boolean;
}

export interface TurnFactor {
  angle: number;
  factor: number;
}

export interface TrackingUpdateData {
  currentLat: number;
  currentLng: number;
  speed: number;
  heading: number;
  lastUpdated: Date;
}

export interface OSRMResponse {
  routes?: Array<{
    geometry?: {
      coordinates?: Array<[number, number]>;
    };
  }>;
}

export interface TrackingEventData {
  shipmentId: string;
  status: string;
  location: string;
  remarks?: string;
  timestamp?: Date;
}

export interface ShipmentData {
  id: string;
  waybillNumber: string;
  origin: string;
  destination: string;
  currentStatus: string;
}

export interface VehicleTrackingData {
  id: string;
  shipmentId: string;
  currentLat: number;
  currentLng: number;
  speed: number;
  heading: number;
  lastUpdated: Date;
  routePoints?: LatLng[];
  segments?: RouteSegmentData[];
}

// Database Model Types (defensive access)
export interface DatabaseModels {
  Shipment?: unknown;
  shipment?: unknown;
  VehicleTracking?: unknown;
  vehicleTracking?: unknown;
  RouteSegment?: unknown;
  routeSegment?: unknown;
  TrackingEvent?: unknown;
  trackingEvent?: unknown;
}

// API Request/Response Types
export interface TrackingGetParams {
  waybillNumber: string;
  t?: number; // cache buster
}

export interface TrackingPostBody {
  waybillNumber: string;
  status: string;
  location?: string;
  remarks?: string;
  estimatedDelivery?: string;
  estimatedDeliveryTime?: string;
  transportType?: string;
}

export interface TrackingStreamParams {
  waybillNumber: string;
}

// Component Props
export interface VehicleTrackingMapProps {
  waybillNumber: string;
}

export interface AnimatedVehicleMarkerProps {
  position: LatLng;
  rotation: number;
  isUrban: boolean;
}

export interface MapControllerProps {
  position: LatLng;
  followMode: boolean;
  isUrban: boolean;
  userInteracted: () => void;
}

// Utility Types
export type CorridorKey = `${string}|${string}`;

export interface CorridorDefinition {
  [key: CorridorKey]: string[];
}
