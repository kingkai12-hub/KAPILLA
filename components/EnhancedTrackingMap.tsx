"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
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
  currentLocation?: Location | null;
  routePath?: [number, number][];
  remainingPath?: [number, number][];
  checkIns?: Location[];
  key?: string;
}

// Animated Vehicle Component
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
        width: 32px;
        height: 32px;
        z-index: 1000;
        transform: rotate(${rotation}deg);
        transition: transform 0.5s ease-in-out;
      ">
        <div style="
          position: absolute;
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #dc2626, #ef4444);
          border-radius: 50%;
          top: 4px;
          left: 4px;
          border: 3px solid #ffffff;
          box-shadow: 0 3px 8px rgba(220,38,38,0.4);
        "></div>
        <div style="
          position: absolute;
          width: 32px;
          height: 32px;
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
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-bottom: 10px solid #fbbf24;
          top: -6px;
          left: 8px;
          filter: drop-shadow(0 2px 3px rgba(251,191,36,0.5));
        "></div>
        <!-- Speed indicator -->
        <div style="
          position: absolute;
          bottom: -20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: bold;
          white-space: nowrap;
        ">${speed.toFixed(0)} km/h</div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.3); opacity: 0.1; }
          100% { transform: scale(1); opacity: 0.3; }
        }
      </style>
    `,
    className: 'vehicle-marker',
    iconSize: [32, 40],
    iconAnchor: [16, 20],
  });

  return (
    <Marker position={position} icon={vehicleIcon}>
      <Popup>
        <div className="text-center p-3 bg-white rounded-lg shadow-lg min-w-[200px]">
          <div className="font-bold text-red-600 mb-2">🚚 Vehicle Status</div>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Speed:</span>
              <span className="font-semibold">{speed.toFixed(1)} km/h</span>
            </div>
            <div className="flex justify-between">
              <span>Heading:</span>
              <span className="font-semibold">{rotation.toFixed(0)}°</span>
            </div>
            <div className="flex justify-between">
              <span>Progress:</span>
              <span className="font-semibold">{(progress * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={`font-semibold ${speed > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {speed > 0 ? '🟢 Moving' : '🔴 Stopped'}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export default function EnhancedTrackingMap({
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
  const [isMoving, setIsMoving] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const animationRef = useRef<number | null>(null);
  const currentIndexRef = useRef(0);
  const progressRef = useRef(0);
  const lastTimeRef = useRef(Date.now());

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize vehicle position and start animation
  useEffect(() => {
    if (!isClient || routePath.length < 2) return;

    try {
      // Start from beginning of route
      currentIndexRef.current = 0;
      progressRef.current = 0;
      setVehiclePosition(routePath[0]);
      setRouteProgress(0);
      setIsMoving(true);

      // Start animation
      const animate = () => {
        const currentTime = Date.now();
        const deltaTime = (currentTime - lastTimeRef.current) / 1000; // Convert to seconds
        lastTimeRef.current = currentTime;

        const currentPos = routePath[currentIndexRef.current];
        const nextPos = routePath[currentIndexRef.current + 1];
        
        if (!nextPos) {
          // Journey complete
          setIsMoving(false);
          setVehicleSpeed(0);
          setRouteProgress(1);
          return;
        }

        // Calculate segment distance
        const segmentDistance = calculateDistance(currentPos[0], currentPos[1], nextPos[0], nextPos[1]);
        
        // Variable speed based on segment type
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
        
        // Add realistic speed variations
        const speedVariation = Math.sin(currentTime / 5000) * 8;
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
        
        // Convert speed to progress
        const speedKmPerSecond = calculatedSpeed / 3600;
        const progressDelta = (speedKmPerSecond * deltaTime) / segmentDistance;
        
        progressRef.current += progressDelta;
        
        // Check if segment is complete
        if (progressRef.current >= 1) {
          progressRef.current = 0;
          currentIndexRef.current++;
          
          if (currentIndexRef.current >= routePath.length - 1) {
            // Journey complete
            setIsMoving(false);
            setVehicleSpeed(0);
            setVehiclePosition(routePath[routePath.length - 1]);
            setRouteProgress(1);
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
        ) * (180 / Math.PI) - 90;
        
        // Calculate overall progress
        const totalSegments = routePath.length - 1;
        const completedSegments = currentIndexRef.current;
        const currentSegmentProgress = progressRef.current;
        const overallProgress = (completedSegments + currentSegmentProgress) / totalSegments;
        
        // Update vehicle state
        setVehiclePosition(interpolatedPos);
        setVehicleRotation(angle);
        setVehicleSpeed(calculatedSpeed);
        setRouteProgress(overallProgress);
        
        // Continue animation
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    } catch (error) {
      console.error('❌ EnhancedTrackingMap error:', error);
      setMapError(error instanceof Error ? error.message : String(error));
    }
  }, [isClient, routePath, key]);

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
          zoom={zoom || 6} 
          style={{ height: '100%', width: '100%', minHeight: '500px', borderRadius: '0.75rem' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Route path */}
          {routePath.length > 1 && (
            <Polyline 
              positions={routePath} 
              color="#3b82f6" 
              weight={4}
              opacity={0.7}
              dashArray="10, 5"
            />
          )}
          
          {/* Remaining path */}
          {remainingPath.length > 1 && (
            <Polyline 
              positions={remainingPath} 
              color="#94a3b8" 
              weight={3}
              opacity={0.5}
              dashArray="5, 10"
            />
          )}
          
          {/* Start point */}
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

          {/* End point */}
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

          {/* Check-in points */}
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

          {/* Animated vehicle */}
          {routePath.length > 1 && (
            <VehicleMarker 
              position={vehiclePosition}
              speed={vehicleSpeed}
              rotation={vehicleRotation}
              progress={routeProgress}
            />
          )}

          {/* Current location (if different from vehicle position) */}
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
        
        {/* Progress indicator */}
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
          <div className="text-sm font-medium text-gray-700 mb-2">Route Progress</div>
          <div className="w-48 bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${routeProgress * 100}%` }}
            />
          </div>
          <div className="text-xs text-gray-600">
            {(routeProgress * 100).toFixed(1)}% Complete
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Status: {isMoving ? '🟢 In Transit' : '🔴 Stopped'}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('❌ EnhancedTrackingMap render error:', error);
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
