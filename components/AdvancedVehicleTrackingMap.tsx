"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, useRef, useCallback } from 'react';

// Extend window interface for zoom tracking
declare global {
  interface Window {
    currentMapZoomSetter?: (zoom: number) => void;
  }
}

// Fix for default marker icons in Next.js/React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Linear interpolation between two points
function interpolatePosition(start: [number, number], end: [number, number], progress: number): [number, number] {
  return [
    start[0] + (end[0] - start[0]) * progress,
    start[1] + (end[1] - start[1]) * progress
  ];
}

// Enhanced state persistence interface
interface TrackingState {
  currentIndex: number;
  segmentProgress: number;
  timestamp: number;
  lastActiveTime: number;
  routeHash: string;
  totalDistance: number;
  completedDistance: number;
}

// Speed simulation engine
class SpeedSimulator {
  private baseSpeed: number = 50; // km/h
  private speedVariation: number = 0;
  private lastVariationUpdate: number = 0;

  // Determine road type based on segment distance and location
  getRoadType(segmentDistance: number, isInCity: boolean = false): 'city' | 'highway' | 'rural' {
    if (isInCity || segmentDistance <= 2) return 'city';
    if (segmentDistance > 5) return 'highway';
    return 'rural';
  }

  // Calculate speed based on road type with realistic variations
  calculateSpeed(segmentDistance: number, isInCity: boolean = false): number {
    const currentTime = Date.now();
    
    // Update speed variation every 3-5 seconds for realistic changes
    if (currentTime - this.lastVariationUpdate > 3000 + Math.random() * 2000) {
      this.speedVariation = (Math.random() - 0.5) * 10; // ±5 km/h variation
      this.lastVariationUpdate = currentTime;
    }

    const roadType = this.getRoadType(segmentDistance, isInCity);
    
    switch (roadType) {
      case 'city':
        // City: 20-50 km/h with traffic variations
        this.baseSpeed = 35;
        return Math.max(20, Math.min(50, this.baseSpeed + this.speedVariation));
      
      case 'highway':
        // Highway: 60-100 km/h
        this.baseSpeed = 80;
        return Math.max(60, Math.min(100, this.baseSpeed + this.speedVariation));
      
      case 'rural':
        // Rural: 40-70 km/h
        this.baseSpeed = 55;
        return Math.max(40, Math.min(70, this.baseSpeed + this.speedVariation));
      
      default:
        return 50;
    }
  }
}

interface Location {
  lat: number;
  lng: number;
  label?: string;
  timestamp?: string;
}

interface MapProps {
  center?: [number, number];
  zoom?: number;
  startPoint?: Location;
  endPoint?: Location;
  currentLocation?: Location | null;
  routePath?: [number, number][];
  remainingPath?: [number, number][];
  checkIns?: Location[];
  key?: string;
}

// Advanced Vehicle Component with realistic truck icon
function VehicleMarker({ position, speed, rotation, progress }: { 
  position: [number, number]; 
  speed: number; 
  rotation: number; 
  progress: number;
}) {
  const vehicleIcon = L.divIcon({
    html: `
      <div style="
        position: relative;
        width: 40px;
        height: 40px;
        z-index: 1000;
        transform: rotate(${rotation}deg);
        transition: transform 0.3s ease-out;
      ">
        <!-- Truck Body -->
        <div style="
          position: absolute;
          width: 30px;
          height: 20px;
          background: linear-gradient(135deg, #dc2626, #ef4444);
          border-radius: 4px;
          top: 10px;
          left: 5px;
          border: 2px solid #ffffff;
          box-shadow: 0 3px 10px rgba(220,38,38,0.4);
        "></div>
        
        <!-- Truck Cabin -->
        <div style="
          position: absolute;
          width: 12px;
          height: 16px;
          background: linear-gradient(135deg, #b91c1c, #dc2626);
          border-radius: 2px;
          top: 8px;
          left: 18px;
          border: 2px solid #ffffff;
        "></div>
        
        <!-- Direction Arrow -->
        <div style="
          position: absolute;
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-bottom: 12px solid #fbbf24;
          top: -8px;
          left: 11px;
          filter: drop-shadow(0 2px 3px rgba(251,191,36,0.6));
        "></div>
        
        <!-- Speed Badge -->
        <div style="
          position: absolute;
          bottom: -22px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #1f2937, #374151);
          color: white;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: bold;
          white-space: nowrap;
          border: 1px solid #4b5563;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">${speed.toFixed(0)} km/h</div>
        
        <!-- Pulse Animation -->
        <div style="
          position: absolute;
          width: 40px;
          height: 40px;
          border: 2px solid #dc2626;
          border-radius: 50%;
          top: 0;
          left: 0;
          animation: pulse 2s infinite;
          opacity: 0.3;
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0.1; }
          100% { transform: scale(1); opacity: 0.3; }
        }
      </style>
    `,
    className: 'advanced-vehicle-marker',
    iconSize: [40, 50],
    iconAnchor: [20, 25],
  });

  return (
    <Marker position={position} icon={vehicleIcon}>
      <Popup>
        <div className="text-center p-3 bg-white rounded-lg shadow-lg min-w-[220px]">
          <div className="font-bold text-red-600 mb-2 flex items-center justify-center gap-2">
            <span>🚚</span>
            <span>Vehicle Status</span>
          </div>
          <div className="text-sm space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Speed:</span>
              <span className="font-semibold text-blue-600">{speed.toFixed(1)} km/h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Heading:</span>
              <span className="font-semibold">{rotation.toFixed(0)}°</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Progress:</span>
              <span className="font-semibold text-green-600">{(progress * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Status:</span>
              <span className={`font-semibold ${speed > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {speed > 0 ? '🟢 Moving' : '🔴 Stopped'}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

// Map Instance Handler to capture map reference
function MapInstanceHandler({ onMapReady }: { onMapReady: (map: any) => void }) {
  const map = useMap();
  
  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);
  
  return null;
}

// Map Controller for smooth pan and zoom with intelligent zoom control
function MapController({ center, zoom, vehiclePosition, routePath, isSystemView }: { 
  center?: [number, number]; 
  zoom?: number;
  vehiclePosition?: [number, number];
  routePath?: [number, number][];
  isSystemView?: boolean;
}) {
  const map = useMap();
  const defaultCenter: [number, number] = [-6.8151812, 39.2864692];
  const defaultZoom = 18; // Maximum default zoom for best road and place name visibility
  const isFollowingRef = useRef(true);
  const userZoomRef = useRef(zoom || defaultZoom);
  const hasUserInteractedRef = useRef(false);
  const isSystemViewRef = useRef(isSystemView !== false); // Track system view state

  // Calculate optimal zoom based on route characteristics with enhanced road visibility
  const calculateOptimalZoom = useCallback((route: [number, number][]) => {
    if (route.length < 2) return 18; // Higher default for better road visibility

    // Calculate route bounds
    const lats = route.map(point => point[0]);
    const lngs = route.map(point => point[1]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Calculate route density and area
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const routeArea = latDiff * lngDiff;
    
    // Enhanced density calculation with segment analysis
    let totalDistance = 0;
    let shortSegments = 0;
    let mediumSegments = 0;
    let longSegments = 0;
    
    for (let i = 1; i < route.length; i++) {
      const distance = calculateDistance(
        route[i - 1][0], route[i - 1][1],
        route[i][0], route[i][1]
      );
      totalDistance += distance;
      
      if (distance <= 1) shortSegments++;
      else if (distance <= 5) mediumSegments++;
      else longSegments++;
    }
    
    const avgSegmentDistance = totalDistance / (route.length - 1);
    const density = route.length / (routeArea || 0.01);
    
    // Enhanced urban detection based on multiple factors
    const shortSegmentRatio = shortSegments / (route.length - 1);
    const isUrban = (
      density > 50 || 
      shortSegmentRatio > 0.6 || 
      avgSegmentDistance < 2
    );
    
    // Calculate optimal zoom with enhanced road visibility focus
    let optimalZoom;
    
    if (isUrban) {
      // Urban areas - maximum zoom for detailed road geometry and place names
      if (routeArea < 0.005) optimalZoom = 19; // Very tight urban area - maximum detail
      else if (routeArea < 0.01) optimalZoom = 18; // Tight urban area - streets visible
      else if (routeArea < 0.05) optimalZoom = 17; // Small urban area - major roads clear
      else if (routeArea < 0.2) optimalZoom = 16; // Medium urban area - road network visible
      else optimalZoom = 15; // Large urban area - main roads visible
    } else {
      // Rural areas - higher zoom for better visibility while maintaining context
      if (routeArea < 0.05) optimalZoom = 17; // Small rural area - detailed view
      else if (routeArea < 0.2) optimalZoom = 16; // Medium rural area - roads visible
      else if (routeArea < 1) optimalZoom = 15; // Large rural area - highway network
      else if (routeArea < 3) optimalZoom = 14; // Very large rural area - major roads
      else optimalZoom = 13; // Extensive rural area - overview with main highways
    }
    
    // Ensure minimum zoom for road and place name visibility
    // Zoom 15+ is generally needed for clear road names and street details
    // Zoom 17+ is ideal for urban street names and landmarks
    const minZoom = isUrban ? 16 : 14;
    return Math.max(minZoom, Math.min(19, optimalZoom));
  }, []);

  useEffect(() => {
    if (!map) return;

    // Calculate optimal zoom for route
    const effectiveCenter = center || defaultCenter;
    const effectiveZoom = zoom || defaultZoom;
    
    // Update system view ref when prop changes
    isSystemViewRef.current = isSystemView !== false;
    
    // Set initial view with bounds
    map.setView(effectiveCenter, effectiveZoom, { animate: false });
    
    // Set reasonable map bounds to prevent going off-screen
    const maxBounds = [
      [-85, -180], // Southwest corner
      [85, 180]   // Northeast corner
    ];
    map.setMaxBounds(maxBounds);
    map.setMaxBoundsViscosity(1.0); // Strong resistance at bounds
    
    // Calculate optimal zoom for route if available
    if (routePath && routePath.length > 1) {
      const optimalZoom = calculateOptimalZoom(routePath);
      if (optimalZoom !== effectiveZoom) {
        map.setView(effectiveCenter, optimalZoom, { animate: false });
      }
    }
    
    // Update user zoom reference
    userZoomRef.current = map.getZoom();
    isFollowingRef.current = isSystemViewRef.current;
    hasUserInteractedRef.current = false;

    // Enhanced keyboard controls
    const handleKeyPress = (e: KeyboardEvent) => {
      switch(e.key) {
        case '+':
        case '=':
          map.zoomIn();
          hasUserInteractedRef.current = true;
          userZoomRef.current = map.getZoom();
          break;
        case '-':
        case '_':
          map.zoomOut();
          hasUserInteractedRef.current = true;
          userZoomRef.current = map.getZoom();
          break;
        case 'f':
        case 'F':
          // Toggle follow vehicle (only works in System View)
          if (isSystemViewRef.current) {
            isFollowingRef.current = !isFollowingRef.current;
            if (isFollowingRef.current && vehiclePosition) {
              map.panTo(vehiclePosition);
              hasUserInteractedRef.current = false;
            }
          }
          break;
        case 'a':
        case 'A':
          // Toggle between System View and User View
          const newSystemView = !isSystemViewRef.current;
          isSystemViewRef.current = newSystemView;
          
          if (newSystemView) {
            // System View - reset to optimal zoom and follow
            const optimalZoom = routePath && routePath.length > 1 
              ? calculateOptimalZoom(routePath) 
              : defaultZoom;
            map.setView(vehiclePosition || effectiveCenter, optimalZoom, { animate: true });
            isFollowingRef.current = true;
            hasUserInteractedRef.current = false;
          } else {
            // User View - stop following, maintain current view
            isFollowingRef.current = false;
            hasUserInteractedRef.current = true;
          }
          break;
      }
    };

    // Enhanced user interaction tracking (reduced sensitivity)
    const handleUserInteraction = () => {
      // Mark as user interaction in User View mode
      if (!isSystemViewRef.current) {
        hasUserInteractedRef.current = true;
        userZoomRef.current = map.getZoom();
      }
      // Always update zoom state for UI
      if (typeof window !== 'undefined' && window.currentMapZoomSetter) {
        window.currentMapZoomSetter(map.getZoom());
      }
    };

    const handleZoomEnd = () => {
      // Update zoom state in both modes
      userZoomRef.current = map.getZoom();
      if (!isSystemViewRef.current) {
        hasUserInteractedRef.current = true;
      }
      // Update current zoom state for UI
      if (typeof window !== 'undefined' && window.currentMapZoomSetter) {
        window.currentMapZoomSetter(map.getZoom());
      }
    };

    // Map event listeners for zoom tracking
    map.on('zoomstart', handleUserInteraction);
    map.on('zoomend', handleZoomEnd);
    map.on('zoom', () => {
      // Real-time zoom tracking
      if (typeof window !== 'undefined' && window.currentMapZoomSetter) {
        window.currentMapZoomSetter(map.getZoom());
      }
    });
    
    document.addEventListener('keydown', handleKeyPress);
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      map.off('zoomstart', handleUserInteraction);
      map.off('zoomend', handleZoomEnd);
      map.off('zoom');
    };
  }, [center, zoom, map, routePath, calculateOptimalZoom, vehiclePosition, isSystemView]);

  // Enhanced vehicle following with intelligent zoom management and boundary constraints
  useEffect(() => {
    if (!map) return;

    // Only follow vehicle in System View and when user hasn't manually interacted
    if (isSystemViewRef.current && isFollowingRef.current && vehiclePosition && !hasUserInteractedRef.current) {
      const currentCenter = map.getCenter();
      const vehicleLatLng = L.latLng(vehiclePosition[0], vehiclePosition[1]);
      const distance = currentCenter.distanceTo(vehicleLatLng);
      
      // Keep vehicle centered with lower threshold for better visibility
      if (distance > 200) {
        // Ensure vehicle stays within reasonable bounds
        const bounds = map.getBounds();
        const vehicleBounds = L.latLngBounds(vehiclePosition, vehiclePosition);
        
        // Only move if vehicle is still within reasonable geographic bounds
        if (bounds.contains(vehicleLatLng) || 
            (Math.abs(vehiclePosition[0]) < 90 && Math.abs(vehiclePosition[1]) < 180)) {
          map.setView(vehiclePosition, map.getZoom(), { animate: true, duration: 0.8 });
        }
      }
    }
  }, [vehiclePosition, map]); // Removed routePath dependency to reduce re-renders

  // Update view mode state when prop changes
  useEffect(() => {
    isSystemViewRef.current = isSystemView !== false;
    if (!isSystemViewRef.current) {
      // User View - stop following and mark as user interacted
      isFollowingRef.current = false;
      hasUserInteractedRef.current = true;
    } else {
      // System View - reset following state
      isFollowingRef.current = true;
      hasUserInteractedRef.current = false;
    }
  }, [isSystemView]);

  return null;
}

export default function AdvancedVehicleTrackingMap({
  center,
  zoom,
  startPoint,
  endPoint,
  currentLocation,
  routePath = [],
  remainingPath = [],
  checkIns = [],
  key 
}: MapProps) {
  const [isClient, setIsClient] = useState(false);
  const [vehiclePosition, setVehiclePosition] = useState<[number, number]>(center || [-6.8151812, 39.2864692]);
  const [vehicleSpeed, setVehicleSpeed] = useState(0);
  const [vehicleRotation, setVehicleRotation] = useState(0);
  const [routeProgress, setRouteProgress] = useState(0);
  const [traveledPath, setTraveledPath] = useState<[number, number][]>([]);
  const [isMoving, setIsMoving] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isSystemView, setIsSystemView] = useState(true); // Default to System View
  const [mapInstance, setMapInstance] = useState<any>(null); // Store map instance
  const [currentZoom, setCurrentZoom] = useState(zoom || 18); // Track current zoom level

  const animationRef = useRef<number | null>(null);
  const currentIndexRef = useRef(0);
  const progressRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const speedSimulatorRef = useRef(new SpeedSimulator());
  const fullRouteRef = useRef<[number, number][]>([]);
  const totalDistanceRef = useRef(0);
  const completedDistanceRef = useRef(0);
  const isRestoringRef = useRef(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Calculate total route distance
  const calculateTotalDistance = useCallback((route: [number, number][]) => {
    let total = 0;
    for (let i = 1; i < route.length; i++) {
      total += calculateDistance(
        route[i - 1][0], route[i - 1][1],
        route[i][0], route[i][1]
      );
    }
    return total;
  }, []);

  // Generate route hash for change detection
  const generateRouteHash = useCallback((route: [number, number][]) => {
    return route.map(point => point.join(',')).join('|');
  }, []);

  // Save tracking state to localStorage
  const saveTrackingState = useCallback(() => {
    try {
      const currentState: TrackingState = {
        currentIndex: currentIndexRef.current,
        segmentProgress: progressRef.current,
        timestamp: Date.now(),
        lastActiveTime: Date.now(),
        routeHash: generateRouteHash(fullRouteRef.current),
        totalDistance: totalDistanceRef.current,
        completedDistance: completedDistanceRef.current
      };
      localStorage.setItem('advancedVehicleTracking', JSON.stringify(currentState));
    } catch (error) {
      console.warn('Failed to save tracking state:', error);
    }
  }, [generateRouteHash]);

  // Load tracking state from localStorage
  const loadTrackingState = useCallback((): TrackingState | null => {
    try {
      const saved = localStorage.getItem('advancedVehicleTracking');
      if (!saved) return null;
      
      const state = JSON.parse(saved) as TrackingState;
      const currentRouteHash = generateRouteHash(fullRouteRef.current);
      
      // Only restore if it's the same route and not too old (24 hours)
      if (state.routeHash === currentRouteHash && 
          Date.now() - state.timestamp < 24 * 60 * 60 * 1000) {
        return state;
      }
    } catch (error) {
      console.warn('Failed to load tracking state:', error);
    }
    return null;
  }, [generateRouteHash]);

  // Calculate expected position based on elapsed time
  const calculateExpectedPosition = useCallback((savedState: TrackingState) => {
    const timeElapsed = Date.now() - savedState.lastActiveTime;
    const timeInSeconds = timeElapsed / 1000;
    
    let tempIndex = savedState.currentIndex;
    let tempProgress = savedState.segmentProgress;
    let tempCompletedDistance = savedState.completedDistance;
    
    // Simulate movement during elapsed time
    while (tempIndex < fullRouteRef.current.length - 1 && timeInSeconds > 0) {
      const currentPos = fullRouteRef.current[tempIndex];
      const nextPos = fullRouteRef.current[tempIndex + 1];
      const segmentDistance = calculateDistance(currentPos[0], currentPos[1], nextPos[0], nextPos[1]);
      
      // Use average speed for simulation
      const avgSpeed = segmentDistance <= 2 ? 35 : segmentDistance > 5 ? 80 : 55;
      const speedKmPerSecond = avgSpeed / 3600;
      const timeForSegment = segmentDistance / speedKmPerSecond;
      const remainingSegmentTime = timeForSegment * (1 - tempProgress);
      
      if (timeInSeconds >= remainingSegmentTime) {
        // Complete this segment
        tempIndex++;
        tempProgress = 0;
        tempCompletedDistance += segmentDistance;
        break; // For simplicity, just process one segment at a time
      } else {
        // Partial progress in this segment
        tempProgress += timeInSeconds / timeForSegment;
        tempCompletedDistance += segmentDistance * tempProgress;
        break;
      }
    }
    
    return { tempIndex, tempProgress, tempCompletedDistance };
  }, []);

  // Combine route paths for full journey
  useEffect(() => {
    const fullRoute = [...routePath, ...remainingPath];
    fullRouteRef.current = fullRoute;
    totalDistanceRef.current = calculateTotalDistance(fullRoute);
  }, [routePath, remainingPath, calculateTotalDistance]);

  // Enhanced initialization with state restoration
  useEffect(() => {
    if (!isClient || routePath.length < 2) return;

    try {
      isRestoringRef.current = true;
      
      // Try to restore saved state
      const savedState = loadTrackingState();
      
      if (savedState) {
        // Calculate expected position based on elapsed time
        const expected = calculateExpectedPosition(savedState);
        
        // Update refs with restored/calculated state
        currentIndexRef.current = expected.tempIndex;
        progressRef.current = expected.tempProgress;
        completedDistanceRef.current = expected.tempCompletedDistance;
        
        // Set initial position (interpolated if progress > 0)
        let initialPosition: [number, number];
        if (expected.tempIndex < routePath.length - 1 && expected.tempProgress > 0) {
          initialPosition = interpolatePosition(
            routePath[expected.tempIndex],
            routePath[expected.tempIndex + 1],
            expected.tempProgress
          );
        } else {
          initialPosition = routePath[expected.tempIndex];
        }
        
        // Update state smoothly
        setVehiclePosition(initialPosition);
        setRouteProgress(expected.tempCompletedDistance / totalDistanceRef.current);
        
        // Rebuild traveled path
        const traveled: [number, number][] = [];
        for (let i = 0; i <= expected.tempIndex && i < routePath.length; i++) {
          traveled.push(routePath[i]);
        }
        if (expected.tempProgress > 0 && expected.tempIndex < routePath.length - 1) {
          traveled[expected.tempIndex] = initialPosition;
        }
        setTraveledPath(traveled);
        
        setIsMoving(expected.tempIndex < routePath.length - 1);
      } else {
        // No saved state - start fresh
        currentIndexRef.current = 0;
        progressRef.current = 0;
        completedDistanceRef.current = 0;
        setVehiclePosition(routePath[0]);
        setRouteProgress(0);
        setTraveledPath([routePath[0]]);
        setIsMoving(true);
      }
      
      // Clear old saved state if journey is complete
      if (currentIndexRef.current >= routePath.length - 1) {
        localStorage.removeItem('advancedVehicleTracking');
      }
      
    } catch (error) {
      console.error('Error initializing vehicle position:', error);
      // Fallback to start position
      currentIndexRef.current = 0;
      progressRef.current = 0;
      completedDistanceRef.current = 0;
      setVehiclePosition(routePath[0]);
      setRouteProgress(0);
      setTraveledPath([routePath[0]]);
      setIsMoving(true);
    } finally {
      isRestoringRef.current = false;
    }
  }, [isClient, routePath, loadTrackingState, calculateExpectedPosition, calculateTotalDistance]);

  // Enhanced animation loop with state persistence
  useEffect(() => {
    if (!isClient || routePath.length < 2 || isRestoringRef.current) return;

    setIsMoving(true); // Ensure moving state is set

    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - lastTimeRef.current) / 1000; // Convert to seconds
      lastTimeRef.current = currentTime;

      // Prevent animation if route is invalid
      if (currentIndexRef.current >= routePath.length - 1) {
        setIsMoving(false);
        setVehicleSpeed(0);
        setRouteProgress(1);
        localStorage.removeItem('advancedVehicleTracking');
        return;
      }

      const currentPos = routePath[currentIndexRef.current];
      const nextPos = routePath[currentIndexRef.current + 1];
      
      if (!nextPos) {
        setIsMoving(false);
        setVehicleSpeed(0);
        setRouteProgress(1);
        setTraveledPath(routePath);
        localStorage.removeItem('advancedVehicleTracking');
        return;
      }

      // Calculate segment distance
      const segmentDistance = calculateDistance(currentPos[0], currentPos[1], nextPos[0], nextPos[1]);
      
      // Prevent division by zero
      if (segmentDistance <= 0) {
        currentIndexRef.current++;
        progressRef.current = 0;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      
      // Determine if we're in a city area
      const isInCity = segmentDistance <= 2;
      
      // Calculate speed using simulator
      const calculatedSpeed = speedSimulatorRef.current.calculateSpeed(segmentDistance, isInCity);
      
      // Convert speed to progress with safety checks
      const speedKmPerSecond = calculatedSpeed / 3600;
      const progressDelta = (speedKmPerSecond * deltaTime) / segmentDistance;
      
      // Ensure progressDelta is reasonable and not NaN
      if (isNaN(progressDelta) || !isFinite(progressDelta) || progressDelta <= 0) {
        progressRef.current += 0.001; // Small default progress
      } else {
        progressRef.current += progressDelta;
      }
      
      // Check if segment is complete
      if (progressRef.current >= 1) {
        progressRef.current = 0;
        currentIndexRef.current++;
        
        // Update traveled path
        setTraveledPath(prev => [...prev, nextPos]);
        
        if (currentIndexRef.current >= routePath.length - 1) {
          setIsMoving(false);
          setVehicleSpeed(0);
          setVehiclePosition(routePath[routePath.length - 1]);
          setRouteProgress(1);
          setTraveledPath(routePath);
          localStorage.removeItem('advancedVehicleTracking');
          return;
        }
      }
      
      // Calculate interpolated position
      const interpolatedPos = interpolatePosition(
        routePath[currentIndexRef.current],
        routePath[currentIndexRef.current + 1],
        progressRef.current
      );
      
      // Calculate rotation based on movement direction
      const angle = Math.atan2(
        routePath[currentIndexRef.current + 1][1] - routePath[currentIndexRef.current][1],
        routePath[currentIndexRef.current + 1][0] - routePath[currentIndexRef.current][0]
      );
      
      // Add boundary checking for interpolated position
      if (Math.abs(interpolatedPos[0]) < 85 && Math.abs(interpolatedPos[1]) < 180) {
        setVehiclePosition(interpolatedPos);
        setVehicleRotation(angle);
        setVehicleSpeed(calculatedSpeed);
        
        // Update route progress
        const completedDistance = completedDistanceRef.current + (segmentDistance * progressRef.current);
        setRouteProgress(completedDistance / totalDistanceRef.current);
        completedDistanceRef.current = completedDistance;
      } else {
        // Skip this segment if it would go out of bounds
        progressRef.current = 0;
        currentIndexRef.current++;
      }
      
      // Save state periodically (every 2 seconds when active, every 5 seconds when inactive)
      const saveInterval = document.hidden ? 5000 : 2000;
      if (Math.floor(currentTime / saveInterval) !== Math.floor((currentTime - deltaTime * 1000) / saveInterval)) {
        saveTrackingState();
      }
      
      // Update traveled path with current position
      setTraveledPath(prev => {
        const newPath = [...prev];
        if (newPath.length > completedSegments) {
          newPath[completedSegments] = interpolatedPos;
        } else {
          newPath.push(interpolatedPos);
        }
        return newPath;
      });
      
      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isClient, routePath, key, saveTrackingState, loadTrackingState, calculateExpectedPosition, calculateTotalDistance]);

  // Track zoom level changes
  useEffect(() => {
    if (mapInstance && !isSystemView) {
      const handleZoomChange = () => {
        const newZoom = mapInstance.getZoom();
        setCurrentZoom(newZoom);
      };
      
      mapInstance.on('zoomend', handleZoomChange);
      
      return () => {
        mapInstance.off('zoomend', handleZoomChange);
      };
    }
  }, [mapInstance, isSystemView]);

  // Set up window callback for zoom tracking
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.currentMapZoomSetter = (zoom: number) => {
        if (!isSystemView) {
          setCurrentZoom(zoom);
        }
      };
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.currentMapZoomSetter = undefined;
      }
    };
  }, [isSystemView]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && fullRouteRef.current.length > 1) {
        // Page became visible - check if we need to update position
        const savedState = loadTrackingState();
        if (savedState) {
          const expected = calculateExpectedPosition(savedState);
          if (expected.tempIndex > currentIndexRef.current || expected.tempProgress > progressRef.current) {
            currentIndexRef.current = expected.tempIndex;
            progressRef.current = expected.tempProgress;
            completedDistanceRef.current = expected.tempCompletedDistance;
            
            if (expected.tempIndex < routePath.length - 1) {
              const interpolatedPos = interpolatePosition(
                routePath[expected.tempIndex],
                routePath[expected.tempIndex + 1],
                expected.tempProgress
              );
              setVehiclePosition(interpolatedPos);
            }
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadTrackingState, calculateExpectedPosition, routePath]);

  if (!isClient) return null;

  if (mapError) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50 rounded-xl">
        <div className="text-center p-4">
          <div className="text-red-500 mb-2">🗺️ Map Error</div>
          <div className="text-sm text-slate-600">{mapError}</div>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className="relative">
        <MapContainer 
          center={center || [-6.8151812, 39.2864692]} 
          zoom={zoom || 18} 
          style={{ height: '100%', width: '100%', minHeight: '500px', borderRadius: '0.75rem' }}
          zoomControl={false} // Disable default zoom controls for custom ones
          attributionControl={true}
          doubleClickZoom={true}
          scrollWheelZoom={true}
          dragging={true}
          touchZoom={true}
          bounceAtZoomLimits={false}
          maxBoundsViscosity={1.0}
          worldCopyJump={false}
          maxBounds={[
            [-85, -180], // Southwest corner
            [85, 180]   // Northeast corner
          ]}
          minZoom={10}
          maxZoom={19}
        >
          {/* Enhanced tile layer for better road and place name visibility */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            maxNativeZoom={19}
          />
          
          <MapInstanceHandler onMapReady={setMapInstance} />
          
          <MapController 
            center={center} 
            zoom={zoom}
            vehiclePosition={vehiclePosition}
            routePath={fullRouteRef.current}
            isSystemView={isSystemView}
          />
          
          {/* Start Point */}
          {startPoint && (
            <Marker position={[startPoint.lat, startPoint.lng]}>
              <Popup>
                <div className="text-center">
                  <strong className="block text-green-600">📍 Origin</strong>
                  <p className="text-sm font-medium">{startPoint.label}</p>
                  <div className="text-xs text-gray-500 mt-1">Start Point</div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* End Point */}
          {endPoint && (
            <Marker position={[endPoint.lat, endPoint.lng]}>
              <Popup>
                <div className="text-center">
                  <strong className="block text-red-600">🎯 Destination</strong>
                  <p className="text-sm font-medium">{endPoint.label}</p>
                  <div className="text-xs text-gray-500 mt-1">End Point</div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Check-in Points */}
          {checkIns.map((checkIn, index) => (
            <Marker 
              key={`checkin-${index}`} 
              position={[checkIn.lat, checkIn.lng]}
            >
              <Popup>
                <div className="text-center">
                  <strong className="block text-blue-600">📍 Check-in</strong>
                  <p className="text-sm">{checkIn.label}</p>
                  <div className="text-xs text-gray-500">{checkIn.timestamp}</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Traveled Path - BLUE LINE */}
          {traveledPath.length > 1 && (
            <Polyline 
              positions={traveledPath} 
              color="#2563eb" 
              weight={5} 
              opacity={0.8}
              smoothFactor={1}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {/* Remaining Path - RED LINE */}
          {routePath.length > 1 && currentIndexRef.current < routePath.length - 1 && (
            <Polyline 
              positions={[
                vehiclePosition,
                ...routePath.slice(currentIndexRef.current + 1)
              ]} 
              color="#dc2626" 
              weight={4} 
              opacity={0.7}
              dashArray="10, 5"
              smoothFactor={1}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {/* Animated Vehicle */}
          {routePath.length > 1 && (
            <VehicleMarker 
              position={vehiclePosition}
              speed={vehicleSpeed}
              rotation={vehicleRotation}
              progress={routeProgress}
            />
          )}

          {/* Current location (if different from vehicle) */}
          {currentLocation && (
            <Marker position={[currentLocation.lat, currentLocation.lng]}>
              <Popup>
                <div className="text-center">
                  <strong className="block text-blue-600">📍 Current Location</strong>
                  <p className="text-sm">{currentLocation.label}</p>
                  <div className="text-xs text-gray-500">{currentLocation.timestamp}</div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
        
        {/* Enhanced Progress Indicator with Zoom Controls */}
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10 min-w-[320px]">
          <div className="text-sm font-bold text-gray-800 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-red-600">🚚</span>
              <span>Live Tracking</span>
            </div>
            {/* Enhanced View Mode Toggle */}
            <button
              onClick={() => setIsSystemView(!isSystemView)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all transform hover:scale-105 ${
                isSystemView 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border border-blue-400 shadow-md' 
                  : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border border-gray-400 shadow-md'
              }`}
              title={isSystemView ? 'Switch to User View (Manual Control)' : 'Switch to System View (Auto Follow)'}
            >
              {isSystemView ? '🤖 Auto' : '👤 Manual'}
            </button>
          </div>
          
          <div className="space-y-3">
            {/* Enhanced View Mode Indicator */}
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-gray-50">
              <span className="text-gray-600 font-medium">View Mode:</span>
              <span className={`font-bold ${isSystemView ? 'text-blue-600' : 'text-gray-700'}`}>
                {isSystemView ? '🤖 System View (Auto)' : '👤 User View (Manual)'}
              </span>
            </div>
            
            {/* Follow Status Indicator */}
            {isSystemView && (
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-blue-50">
                <span className="text-gray-600 font-medium">Follow Status:</span>
                <span className={`font-bold ${true ? 'text-green-600' : 'text-orange-600'}`}>
                  {true ? '🟢 Following Vehicle' : '🟡 Manual Control'}
                </span>
              </div>
            )}
            
            {/* Current Zoom Level Display */}
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-gray-50">
              <span className="text-gray-600 font-medium">Current Zoom:</span>
              <span className="font-bold text-blue-600" id="current-zoom-level">
                {isSystemView ? '🎯 Auto' : `🔧 ${currentZoom}`}
              </span>
            </div>
            
            {/* Manual Zoom Controls */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
              <span className="text-xs text-gray-600 font-medium">Zoom:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    if (mapInstance) {
                      try {
                        mapInstance.zoomOut({ animate: true, duration: 0.3 });
                        const newZoom = mapInstance.getZoom();
                        setCurrentZoom(newZoom);
                        // Mark as user interaction if in User View
                        if (!isSystemView) {
                          hasUserInteractedRef.current = true;
                        }
                      } catch (error) {
                        console.error('Zoom out error:', error);
                      }
                    }
                  }}
                  className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-bold transition-all transform hover:scale-110 active:scale-95"
                  title="Zoom Out"
                >
                  −
                </button>
                <button
                  onClick={() => {
                    if (mapInstance) {
                      try {
                        mapInstance.zoomIn({ animate: true, duration: 0.3 });
                        const newZoom = mapInstance.getZoom();
                        setCurrentZoom(newZoom);
                        // Mark as user interaction if in User View
                        if (!isSystemView) {
                          hasUserInteractedRef.current = true;
                        }
                      } catch (error) {
                        console.error('Zoom in error:', error);
                      }
                    }
                  }}
                  className="w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-bold transition-all transform hover:scale-110 active:scale-95"
                  title="Zoom In"
                >
                  +
                </button>
              </div>
            </div>
            
            {/* Manual Pan Controls */}
            {!isSystemView && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <span className="text-xs text-gray-600 font-medium">Manual Pan:</span>
                <div className="grid grid-cols-3 gap-1">
                  <div></div>
                  <button
                    onClick={() => {
                      if (mapInstance && !isSystemView) {
                        try {
                          const center = mapInstance.getCenter();
                          mapInstance.panTo([center.lat + 0.002, center.lng], { 
                            animate: true, 
                            duration: 0.3,
                            easeLinearity: 0.5,
                            noMoveStart: true
                          });
                        } catch (error) {
                          console.error('Pan up error:', error);
                        }
                      }
                    }}
                    className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-bold transition-all transform hover:scale-110 active:scale-95"
                    title="Pan Up"
                  >
                    ↑
                  </button>
                  <div></div>
                  <button
                    onClick={() => {
                      if (mapInstance && !isSystemView) {
                        try {
                          const center = mapInstance.getCenter();
                          mapInstance.panTo([center.lat, center.lng - 0.002], { 
                            animate: true, 
                            duration: 0.3,
                            easeLinearity: 0.5,
                            noMoveStart: true
                          });
                        } catch (error) {
                          console.error('Pan left error:', error);
                        }
                      }
                    }}
                    className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-bold transition-all transform hover:scale-110 active:scale-95"
                    title="Pan Left"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => {
                      if (mapInstance && !isSystemView && vehiclePosition) {
                        try {
                          mapInstance.flyTo(vehiclePosition, currentZoom, { 
                            animate: true, 
                            duration: 1.0,
                            easeLinearity: 0.5
                          });
                        } catch (error) {
                          console.error('Center on vehicle error:', error);
                        }
                      }
                    }}
                    className="w-6 h-6 bg-purple-500 hover:bg-purple-600 text-white rounded text-xs font-bold transition-all transform hover:scale-110 active:scale-95"
                    title="Center on Vehicle"
                  >
                    ⚡
                  </button>
                  <button
                    onClick={() => {
                      if (mapInstance && !isSystemView) {
                        try {
                          const center = mapInstance.getCenter();
                          mapInstance.panTo([center.lat, center.lng + 0.002], { 
                            animate: true, 
                            duration: 0.3,
                            easeLinearity: 0.5,
                            noMoveStart: true
                          });
                        } catch (error) {
                          console.error('Pan right error:', error);
                        }
                      }
                    }}
                    className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-bold transition-all transform hover:scale-110 active:scale-95"
                    title="Pan Right"
                  >
                    →
                  </button>
                  <div></div>
                  <button
                    onClick={() => {
                      if (mapInstance && !isSystemView) {
                        try {
                          const center = mapInstance.getCenter();
                          mapInstance.panTo([center.lat - 0.002, center.lng], { 
                            animate: true, 
                            duration: 0.3,
                            easeLinearity: 0.5,
                            noMoveStart: true
                          });
                        } catch (error) {
                          console.error('Pan down error:', error);
                        }
                      }
                    }}
                    className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-bold transition-all transform hover:scale-110 active:scale-95"
                    title="Pan Down"
                  >
                    ↓
                  </button>
                  <div></div>
                </div>
              </div>
            )}
            
            {/* Manual Rotation Controls */}
            {!isSystemView && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <span className="text-xs text-gray-600 font-medium">Rotation:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      if (mapInstance && !isSystemView) {
                        try {
                          const currentBearing = mapInstance.getBearing() || 0;
                          mapInstance.setBearing(currentBearing - 15, { animate: true, duration: 0.3 });
                        } catch (error) {
                          console.error('Rotate left error:', error);
                        }
                      }
                    }}
                    className="w-6 h-6 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-bold transition-all transform hover:scale-110 active:scale-95"
                    title="Rotate Left"
                  >
                    ↺
                  </button>
                  <button
                    onClick={() => {
                      if (mapInstance && !isSystemView) {
                        try {
                          mapInstance.setBearing(0, { animate: true, duration: 0.5 });
                        } catch (error) {
                          console.error('Reset rotation error:', error);
                        }
                      }
                    }}
                    className="w-6 h-6 bg-gray-500 hover:bg-gray-600 text-white rounded text-xs font-bold transition-all transform hover:scale-110 active:scale-95"
                    title="Reset Rotation"
                  >
                    ⊙
                  </button>
                  <button
                    onClick={() => {
                      if (mapInstance && !isSystemView) {
                        try {
                          const currentBearing = mapInstance.getBearing() || 0;
                          mapInstance.setBearing(currentBearing + 15, { animate: true, duration: 0.3 });
                        } catch (error) {
                          console.error('Rotate right error:', error);
                        }
                      }
                    }}
                    className="w-6 h-6 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-bold transition-all transform hover:scale-110 active:scale-95"
                    title="Rotate Right"
                  >
                    ↻
                  </button>
                </div>
              </div>
            )}
            
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Route Progress</span>
                <span className="font-semibold">{(routeProgress * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${routeProgress * 100}%` }}
                />
              </div>
            </div>
            
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Status:</span>
              <span className={`text-xs font-semibold ${isMoving ? 'text-green-600' : 'text-red-600'}`}>
                {isMoving ? '🟢 In Transit' : '🔴 Stopped'}
              </span>
            </div>
            
            {/* Speed */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Current Speed:</span>
              <span className="text-xs font-semibold text-blue-600">{vehicleSpeed.toFixed(1)} km/h</span>
            </div>
          </div>
          
          {/* Enhanced Controls Guide */}
          <div className="text-xs text-gray-600 mt-3 pt-3 border-t border-gray-200 space-y-2">
            <div className="font-semibold text-gray-700 mb-2">🎮 Enhanced Controls:</div>
            <div className="grid grid-cols-1 gap-1">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-mono bg-blue-50 px-1 rounded">A</span>
                <span className="text-gray-600">Toggle Auto/Manual view mode</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-mono bg-blue-50 px-1 rounded">F</span>
                <span className="text-gray-600">Follow vehicle (Auto mode only)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-mono bg-blue-50 px-1 rounded">+/-</span>
                <span className="text-gray-600">Zoom in/out (Manual mode)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-mono bg-blue-50 px-1 rounded">🖱️</span>
                <span className="text-gray-600">Drag to pan (Manual mode)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-mono bg-blue-50 px-1 rounded">⚡</span>
                <span className="text-gray-600">Center on vehicle (Manual mode)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-mono bg-blue-50 px-1 rounded">↑↓←→</span>
                <span className="text-gray-600">Pan controls (Manual mode)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-mono bg-blue-50 px-1 rounded">↺↻</span>
                <span className="text-gray-600">Rotate map (Manual mode)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-mono bg-blue-50 px-1 rounded">⊙</span>
                <span className="text-gray-600">Reset rotation (Manual mode)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-mono bg-blue-50 px-1 rounded">🎯</span>
                <span className="text-gray-600">Double-click to zoom (Manual mode)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-mono bg-blue-50 px-1 rounded">⚙️</span>
                <span className="text-gray-600">Scroll wheel to zoom (Manual mode)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Route Statistics */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-10">
          <div className="text-xs font-semibold text-gray-700 mb-2">Route Info</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Distance:</span>
              <span className="font-medium">
                {totalDistanceRef.current.toFixed(1)} km
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Remaining:</span>
              <span className="font-medium text-red-600">
                {Math.max(0, totalDistanceRef.current - completedDistanceRef.current).toFixed(1)} km
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed:</span>
              <span className="font-medium text-green-600">
                {completedDistanceRef.current.toFixed(1)} km
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('❌ AdvancedVehicleTrackingMap render error:', error);
    return (
      <div className="flex items-center justify-center h-full bg-red-50 rounded-xl">
        <div className="text-center p-4">
          <div className="text-red-500 mb-2">🗺️ Map Error</div>
          <div className="text-sm text-slate-600">{error instanceof Error ? error.message : String(error)}</div>
        </div>
      </div>
    );
  }
}
