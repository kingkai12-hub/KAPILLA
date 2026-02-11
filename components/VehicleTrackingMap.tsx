"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, useRef } from 'react';

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
  currentLocation?: Location;
  routePath?: [number, number][];
  remainingPath?: [number, number][];
  checkIns?: Location[];
}

// Vehicle Component with movement animation and rotation
function VehicleMarker({ position, speed, rotation }: { position: [number, number]; speed: number; rotation: number }) {
  const vehicleIcon = L.divIcon({
    html: `
      <div style="
        position: relative;
        width: 24px;
        height: 24px;
        z-index: 1000;
        transform: rotate(${rotation}deg);
        transition: transform 0.5s ease-in-out;
      ">
        <div style="
          position: absolute;
          width: 18px;
          height: 18px;
          background: linear-gradient(135deg, #dc2626, #ef4444);
          border-radius: 50%;
          top: 3px;
          left: 3px;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(220,38,38,0.4);
        "></div>
        <div style="
          position: absolute;
          width: 24px;
          height: 24px;
          border: 2px solid #dc2626;
          border-radius: 50%;
          top: 0;
          left: 0;
          animation: pulse 2s infinite;
          opacity: 0.3;
        "></div>
        <!-- Direction indicator -->
        <div style="
          position: absolute;
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-bottom: 8px solid #fbbf24;
          top: -4px;
          left: 6px;
          filter: drop-shadow(0 1px 2px rgba(251,191,36,0.5));
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
    className: 'vehicle-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  return (
    <Marker position={position} icon={vehicleIcon}>
      <Popup>
        <div className="text-center p-3 bg-white rounded-lg shadow-lg">
          <div className="font-bold text-red-600 mb-1">🚚 Vehicle</div>
          <div className="text-sm space-y-1">
            <div>Speed: <span className="font-semibold">{speed.toFixed(1)} km/h</span></div>
            <div>Heading: <span className="font-semibold">{rotation.toFixed(0)}°</span></div>
            <div className="text-xs text-gray-500">{new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

function MapController({ center, zoom }: { 
  center?: [number, number]; 
  zoom?: number; 
}) {
  const map = useMap();
  const defaultCenter: [number, number] = [-6.8151812, 39.2864692]; // Office location
  const defaultZoom = 12;

  useEffect(() => {
    if (!map) return;

    const effectiveCenter = center || defaultCenter;
    const effectiveZoom = zoom ?? defaultZoom;

    // Only set view on initial load, don't interfere with user zoom/pan
    map.setView(effectiveCenter, effectiveZoom, { animate: false });
  }, [center, zoom, map]);

  return null;
}

export default function VehicleTrackingMap({ 
  center = [-6.8151812, 39.2864692],
  zoom = 12,
  startPoint,
  endPoint,
  currentLocation,
  routePath = [],
  remainingPath = [],
  checkIns = []
}: MapProps) {
  
  const [isClient, setIsClient] = useState(false);
  const [vehiclePosition, setVehiclePosition] = useState<[number, number]>(center);
  const [vehicleSpeed, setVehicleSpeed] = useState(0);
  const [vehicleRotation, setVehicleRotation] = useState(0);
  const [isMoving, setIsMoving] = useState(false);

  const movementRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentIndexRef = useRef(0);
  const fullRouteRef = useRef<[number, number][]>([]);
  const lastLocationUpdateRef = useRef('');
  const isInitializedRef = useRef(false);
  const segmentProgressRef = useRef(0); // Progress within current segment (0-1)
  const lastUpdateTimeRef = useRef(Date.now());

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Set initial vehicle position and restore state from localStorage
  useEffect(() => {
    // Combine route path and remaining path for full journey
    const fullRoute = [...routePath, ...remainingPath];
    fullRouteRef.current = fullRoute;
    
    // Try to restore saved position from localStorage
    const savedState = localStorage.getItem('vehicleTrackingState');
    let savedIndex = 0;
    let savedProgress = 0;
    
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Check if saved state is recent (within last 24 hours)
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          savedIndex = parsed.currentIndex || 0;
          savedProgress = parsed.segmentProgress || 0;
          console.log('Restored vehicle position from saved state, index:', savedIndex, 'progress:', savedProgress);
        }
      } catch (error) {
        console.warn('Failed to parse saved state:', error);
      }
    }
    
    // Clear any deviated route data - always show proper OSRM routes
    const currentLocationKey = currentLocation ? `${currentLocation.lat},${currentLocation.lng}` : '';
    
    if (currentLocation) {
      // New location update - reset and start fresh with proper routes
      setVehiclePosition([currentLocation.lat, currentLocation.lng]);
      lastLocationUpdateRef.current = currentLocationKey;
      
      // Find closest point in route path to current location
      let closestIndex = 0;
      let minDistance = Infinity;
      routePath.forEach((point, index) => {
        const distance = calculateDistance(currentLocation.lat, currentLocation.lng, point[0], point[1]);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });
      currentIndexRef.current = closestIndex;
      segmentProgressRef.current = 0;
      isInitializedRef.current = true;
      
      // Clear localStorage to ensure fresh start with proper routes
      localStorage.removeItem('vehicleTrackingState');
    } else if (routePath.length > 0 && !isInitializedRef.current) {
      // Start from saved position or beginning of route path
      const startIndex = savedIndex > 0 && savedIndex < fullRoute.length ? savedIndex : 0;
      currentIndexRef.current = startIndex;
      segmentProgressRef.current = savedProgress;
      
      // Set initial position (interpolated if progress > 0)
      if (startIndex < fullRoute.length - 1 && savedProgress > 0) {
        const interpolatedPos = interpolatePosition(
          fullRoute[startIndex],
          fullRoute[startIndex + 1],
          savedProgress
        );
        setVehiclePosition(interpolatedPos);
      } else {
        setVehiclePosition(fullRoute[startIndex]);
      }
      
      isInitializedRef.current = true;
    }
  }, [currentLocation, routePath, remainingPath, center]);

  // Smooth vehicle movement animation
  useEffect(() => {
    const fullRoute = fullRouteRef.current;
    
    if (fullRoute.length < 2 || currentIndexRef.current >= fullRoute.length - 1) {
      setIsMoving(false);
      return;
    }

    setIsMoving(true);
    lastUpdateTimeRef.current = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - lastUpdateTimeRef.current) / 1000; // Convert to seconds
      lastUpdateTimeRef.current = currentTime;

      const currentPos = fullRoute[currentIndexRef.current];
      const nextPos = fullRoute[currentIndexRef.current + 1];
      
      // Calculate segment distance
      const segmentDistance = calculateDistance(currentPos[0], currentPos[1], nextPos[0], nextPos[1]);
      
      // Determine road type and speed
      const isHighway = segmentDistance > 5;
      const isCity = segmentDistance <= 2;
      
      let baseSpeed;
      if (isHighway) {
        baseSpeed = 70; // Highway: 60-80 km/h
      } else if (isCity) {
        baseSpeed = 35; // City: 20-50 km/h
      } else {
        baseSpeed = 50; // Rural: 40-60 km/h
      }
      
      const speedVariation = Math.sin(Date.now() / 5000) * 8;
      const randomFactor = (Math.random() - 0.5) * 4;
      let calculatedSpeed = baseSpeed + speedVariation + randomFactor;
      
      // Speed validation
      if (isHighway) {
        calculatedSpeed = Math.max(60, Math.min(80, calculatedSpeed));
      } else if (isCity) {
        calculatedSpeed = Math.max(20, Math.min(50, calculatedSpeed));
      } else {
        calculatedSpeed = Math.max(40, Math.min(60, calculatedSpeed));
      }
      
      // Convert speed to km/s and calculate progress
      const speedKmPerSecond = calculatedSpeed / 3600;
      const progressDelta = (speedKmPerSecond * deltaTime) / segmentDistance;
      
      segmentProgressRef.current += progressDelta;
      
      // Check if we've completed this segment
      if (segmentProgressRef.current >= 1) {
        segmentProgressRef.current = 0;
        currentIndexRef.current++;
        
        // Check if we've reached the destination
        if (currentIndexRef.current >= fullRoute.length - 1) {
          setIsMoving(false);
          setVehicleSpeed(0);
          setVehiclePosition(fullRoute[fullRoute.length - 1]);
          
          // Clear saved state when journey is complete
          localStorage.removeItem('vehicleTrackingState');
          return;
        }
      }
      
      // Calculate interpolated position
      const interpolatedPos = interpolatePosition(
        fullRoute[currentIndexRef.current],
        fullRoute[currentIndexRef.current + 1],
        segmentProgressRef.current
      );
      
      // Calculate rotation based on movement direction
      const angle = Math.atan2(
        fullRoute[currentIndexRef.current + 1][1] - fullRoute[currentIndexRef.current][1],
        fullRoute[currentIndexRef.current + 1][0] - fullRoute[currentIndexRef.current][0]
      ) * (180 / Math.PI) - 90;
      
      // Update vehicle state
      setVehiclePosition(interpolatedPos);
      setVehicleRotation(angle);
      setVehicleSpeed(calculatedSpeed);
      
      // Save state more frequently when tab is inactive (every 2 seconds)
      // and less frequently when active (every 5 seconds)
      const saveInterval = document.hidden ? 2000 : 5000;
      if (Math.floor(currentTime / saveInterval) !== Math.floor((currentTime - deltaTime * 1000) / saveInterval)) {
        const stateToSave = {
          currentIndex: currentIndexRef.current,
          segmentProgress: segmentProgressRef.current,
          timestamp: Date.now(),
          lastActiveTime: Date.now()
        };
        localStorage.setItem('vehicleTrackingState', JSON.stringify(stateToSave));
      }
      
      // Continue animation
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentLocation, routePath, remainingPath]);

  // Handle page visibility changes - continue movement in background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && fullRouteRef.current.length > 1) {
        // Page became visible - check if we need to update position based on time elapsed
        const savedState = localStorage.getItem('vehicleTrackingState');
        if (savedState) {
          try {
            const parsed = JSON.parse(savedState);
            const timeSinceLastActive = Date.now() - parsed.lastActiveTime;
            
            // If more than 10 seconds have passed, calculate expected position
            if (timeSinceLastActive > 10000 && parsed.currentIndex < fullRouteRef.current.length - 1) {
              console.log('Updating position after inactive period:', timeSinceLastActive / 1000, 'seconds');
              
              // Calculate how many segments should have been completed
              const avgSpeed = 50; // Average speed km/h
              const avgSpeedKmPerSecond = avgSpeed / 3600;
              
              let tempIndex = parsed.currentIndex;
              let tempProgress = parsed.segmentProgress || 0;
              
              // Simulate movement during inactive period
              const simulatedTime = timeSinceLastActive / 1000; // Convert to seconds
              
              while (tempIndex < fullRouteRef.current.length - 1) {
                const currentPos = fullRouteRef.current[tempIndex];
                const nextPos = fullRouteRef.current[tempIndex + 1];
                const segmentDistance = calculateDistance(currentPos[0], currentPos[1], nextPos[0], nextPos[1]);
                const timeForSegment = (segmentDistance / avgSpeedKmPerSecond);
                
                if (simulatedTime > timeForSegment * (1 - tempProgress)) {
                  tempIndex++;
                  tempProgress = 0;
                } else {
                  tempProgress += simulatedTime / timeForSegment;
                  break;
                }
              }
              
              // Update position if progress was made
              if (tempIndex > parsed.currentIndex || tempProgress > (parsed.segmentProgress || 0)) {
                currentIndexRef.current = tempIndex;
                segmentProgressRef.current = Math.min(tempProgress, 0.99);
                
                if (tempIndex < fullRouteRef.current.length - 1) {
                  const interpolatedPos = interpolatePosition(
                    fullRouteRef.current[tempIndex],
                    fullRouteRef.current[tempIndex + 1],
                    segmentProgressRef.current
                  );
                  setVehiclePosition(interpolatedPos);
                }
              }
            }
          } catch (error) {
            console.warn('Failed to calculate background movement:', error);
          }
        }
      }
    };

    // Add event listener for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentLocation, routePath, remainingPath]);

  const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
  });

  if (!isClient) return null;

  return (
    <div className="relative">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%', minHeight: '500px', borderRadius: '0.75rem' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController 
          center={center} 
          zoom={zoom} 
        />
        
        {/* Start Point */}
        {startPoint && (
          <Marker position={[startPoint.lat, startPoint.lng]} icon={defaultIcon}>
            <Popup>
              <div className="text-center">
                <strong className="block text-green-600">📍 Origin</strong>
                <p className="text-sm">{startPoint.label}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* End Point */}
        {endPoint && (
          <Marker position={[endPoint.lat, endPoint.lng]} icon={defaultIcon}>
            <Popup>
              <div className="text-center">
                <strong className="block text-red-600">🎯 Destination</strong>
                <p className="text-sm">{endPoint.label}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Moving Vehicle */}
        <VehicleMarker position={vehiclePosition} speed={vehicleSpeed} rotation={vehicleRotation} />

        {/* Check-in Points */}
        {checkIns.map((checkIn, idx) => (
          <Marker key={idx} position={[checkIn.lat, checkIn.lng]} icon={defaultIcon} opacity={0.6}>
            <Popup>
              <span className="font-bold">✅ Check-in {idx + 1}</span><br/>
              {checkIn.label}<br/>
              <span className="text-xs">{checkIn.timestamp}</span>
            </Popup>
          </Marker>
        ))}

        {/* Traveled Path - Blue Solid Line (includes current interpolated position) */}
        {fullRouteRef.current.length > 1 && (currentIndexRef.current > 0 || segmentProgressRef.current > 0) && (
          <Polyline 
            positions={[
              ...fullRouteRef.current.slice(0, currentIndexRef.current),
              vehiclePosition // Include current interpolated position
            ]} 
            color="#2563eb" 
            weight={4} 
            opacity={0.8}
            smoothFactor={1}
          />
        )}

        {/* Remaining Path - Red Dotted Line (from current position to end) */}
        {fullRouteRef.current.length > 1 && currentIndexRef.current < fullRouteRef.current.length - 1 && (
          <Polyline 
            positions={[
              vehiclePosition, // Start from current position
              ...fullRouteRef.current.slice(currentIndexRef.current + 1)
            ]} 
            color="#dc2626" 
            weight={3} 
            opacity={0.7}
            dashArray="10, 5"
            smoothFactor={1}
          />
        )}

        {/* Current Location Marker (if different from vehicle) */}
        {currentLocation && (
          <Marker position={[currentLocation.lat, currentLocation.lng]} icon={defaultIcon}>
            <Popup>
              <div className="text-center">
                <strong className="block text-blue-600">📍 Current Location</strong>
                <span className="text-xs">{currentLocation.timestamp}</span>
                <p className="text-sm">{currentLocation.label}</p>
                <div className="mt-2 p-2 bg-blue-50 rounded">
                  <div className="text-xs font-medium text-blue-700">
                    {isMoving ? (
                      <>
                        <div className="animate-pulse">🚚 Vehicle Moving</div>
                        <div>Speed: {vehicleSpeed.toFixed(1)} km/h</div>
                        <div>Status: In Transit</div>
                      </>
                    ) : (
                      <>
                        <div>🚚 Vehicle Stationary</div>
                        <div>Speed: 0 km/h</div>
                        <div>Status: Stopped</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
