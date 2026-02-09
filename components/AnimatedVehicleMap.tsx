"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, useRef } from 'react';

// Helper function to safely format timestamps
function formatTimestamp(timestamp?: string): string {
  if (!timestamp) return "Unknown";
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleString();
}

const TANZANIA_CENTER: [number, number] = [-6.3690, 34.8888];

// Haversine formula to calculate distance between two lat/lng points in km
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

interface AnimatedVehicleProps {
  position: [number, number];
  rotation: number;
  speed: number;
}

// Realistic GPS Tracking Vehicle Component
function AnimatedVehicle({ position, rotation, speed }: AnimatedVehicleProps) {
  const [currentPos, setCurrentPos] = useState<[number, number]>(position);
  const [currentRotation, setCurrentRotation] = useState<number>(rotation);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    // Smooth animation to new position
    const steps = 40; // More steps for smoother movement
    let step = 0;
    const duration = 1500; // 1.5 seconds for smooth transition
    const stepDuration = duration / steps;

    const animate = () => {
      if (step < steps) {
        const progress = step / steps;
        // Use ease-in-out for more natural movement
        const easeProgress = progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        // Interpolate position
        const newLat = currentPos[0] + (position[0] - currentPos[0]) * easeProgress;
        const newLng = currentPos[1] + (position[1] - currentPos[1]) * easeProgress;
        const newRotation = currentRotation + (rotation - currentRotation) * easeProgress;

        setCurrentPos([newLat, newLng]);
        setCurrentRotation(newRotation);

        step++;
        setTimeout(() => {
          animationRef.current = requestAnimationFrame(animate);
        }, stepDuration);
      } else {
        setCurrentPos(position);
        setCurrentRotation(rotation);
      }
    };

    animate();
  }, [position, rotation]);

  // Modern attractive GPS tracking vehicle design
  const vehicleIcon = L.divIcon({
    html: `
      <div style="
        position: relative;
        transform: rotate(${currentRotation}deg);
        transition: transform 0.5s ease-in-out;
        width: 40px;
        height: 40px;
        z-index: 1000;
      ">
        <!-- Modern delivery truck with gradient and shadow -->
        <div style="
          position: absolute;
          width: 30px;
          height: 20px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-radius: 6px;
          top: 12px;
          left: 5px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.3);
          border: 1px solid #1e40af;
        "></div>

        <!-- Modern cabin with window -->
        <div style="
          position: absolute;
          width: 12px;
          height: 14px;
          background: linear-gradient(135deg, #64748b, #475569);
          border-radius: 4px 4px 0 0;
          top: 6px;
          left: 5px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          border: 1px solid #334155;
        "></div>
        
        <!-- Cabin window -->
        <div style="
          position: absolute;
          width: 8px;
          height: 6px;
          background: linear-gradient(135deg, #e0f2fe, #bae6fd);
          border-radius: 2px;
          top: 8px;
          left: 7px;
          opacity: 0.8;
        "></div>

        <!-- Modern wheels with detail -->
        <div style="
          position: absolute;
          width: 6px;
          height: 6px;
          background: linear-gradient(135deg, #1f2937, #111827);
          border-radius: 50%;
          bottom: 4px;
          left: 3px;
          box-shadow: 0 2px 3px rgba(0,0,0,0.5);
        "></div>
        <div style="
          position: absolute;
          width: 6px;
          height: 6px;
          background: linear-gradient(135deg, #1f2937, #111827);
          border-radius: 50%;
          bottom: 4px;
          left: 17px;
          box-shadow: 0 2px 3px rgba(0,0,0,0.5);
        "></div>

        <!-- Direction indicator (modern arrow) -->
        <div style="
          position: absolute;
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-bottom: 10px solid #ef4444;
          top: -2px;
          left: 12px;
          filter: drop-shadow(0 2px 4px rgba(239,68,68,0.5));
          transform: scale(1.1);
        "></div>

        <!-- GPS tracking pulse effect (more subtle) -->
        <div style="
          position: absolute;
          width: 40px;
          height: 40px;
          border: 2px solid #10b981;
          border-radius: 50%;
          top: 0;
          left: 0;
          animation: gentlePulse 3s infinite;
          opacity: 0.4;
        "></div>
        
        <!-- Inner pulse for depth -->
        <div style="
          position: absolute;
          width: 30px;
          height: 30px;
          border: 1px solid #10b981;
          border-radius: 50%;
          top: 5px;
          left: 5px;
          animation: gentlePulse 3s infinite 0.5s;
          opacity: 0.3;
        "></div>
      </div>

      <style>
        @keyframes gentlePulse {
          0% {
            transform: scale(0.9);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.1;
          }
          100% {
            transform: scale(0.9);
            opacity: 0.3;
          }
        }
      </style>
    `,
    className: 'gps-tracking-vehicle',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  return (
    <Marker position={currentPos} icon={vehicleIcon}>
      <Popup>
        <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-center mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
            <strong className="text-blue-800 text-sm font-semibold">GPS TRACKING ACTIVE</strong>
          </div>

          <div className="space-y-1 text-xs text-gray-700">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-medium text-green-600">Moving</span>
            </div>
            <div className="flex justify-between">
              <span>Speed:</span>
              <span className="font-medium">{speed.toFixed(0)} km/h</span>
            </div>
            <div className="flex justify-between">
              <span>Heading:</span>
              <span className="font-medium">{currentRotation.toFixed(0)}°</span>
            </div>
            <div className="flex justify-between">
              <span>Last Update:</span>
              <span className="font-medium">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          <div className="mt-3 text-xs text-blue-600 font-medium">
            🔴 Live GPS Tracking • Real-time Location
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

function MapUpdater({ center, zoom, routePath, remainingPath }: { center?: [number, number]; zoom?: number; routePath?: [number, number][]; remainingPath?: [number, number][] }) {
  const map = useMap();
  const defaultCenter: [number, number] = TANZANIA_CENTER;
  const defaultZoom = 6;

  useEffect(() => {
    if (!map) return;

    const effectiveCenter = center || defaultCenter;
    const effectiveZoom = zoom ?? defaultZoom;

    const allPoints = [...(routePath || []), ...(remainingPath || [])];
    
    if (allPoints.length > 1) {
      try {
        const bounds = L.latLngBounds(allPoints);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      } catch (e) {
        console.error("Error fitting bounds:", e);
      }
    } else {
      map.setView(effectiveCenter, effectiveZoom);
    }
  }, [center, zoom, map, routePath, remainingPath]);
  return null;
}

export default function AnimatedVehicleMap({ 
  center = TANZANIA_CENTER,
  zoom = 6,
  startPoint,
  endPoint,
  currentLocation,
  routePath = [],
  remainingPath = [],
  checkIns = []
}: MapProps) {
  
  const [isClient, setIsClient] = useState(false);
  const [vehicleData, setVehicleData] = useState<{ position: [number, number]; rotation: number; speed: number; isMoving: boolean }>({
    position: currentLocation ? [currentLocation.lat, currentLocation.lng] : 
             routePath && routePath.length > 0 ? routePath[0] : 
             startPoint ? [startPoint.lat, startPoint.lng] : [0, 0],
    rotation: 0,
    speed: 0,
    isMoving: false
  });

  const currentIndexRef = useRef(0);
  const isSimulatingRef = useRef(false);
  const previousRouteRef = useRef<[number, number][]>([]);

  useEffect(() => {
    setIsClient(true);
    // Fix icons on client side
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  // Simulate vehicle movement along route
  useEffect(() => {
    if (!currentLocation || !routePath || routePath.length < 2) {
      isSimulatingRef.current = false;
      return;
    }

    // Check if routePath changed
    if (JSON.stringify(routePath) !== JSON.stringify(previousRouteRef.current)) {
      // Find the closest point in routePath to currentLocation
      const currentLocationCoord = [currentLocation.lat, currentLocation.lng] as [number, number];
      let closestIndex = 0;
      let minDistance = Infinity;
      
      routePath.forEach((point, index) => {
        const distance = calculateDistance(currentLocationCoord[0], currentLocationCoord[1], point[0], point[1]);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });
      
      currentIndexRef.current = closestIndex;
      previousRouteRef.current = routePath;
      isSimulatingRef.current = false;
    }

    if (isSimulatingRef.current) return; // Already simulating

    isSimulatingRef.current = true;

    const totalRoute = [...routePath];
    
    const simulateMovement = () => {
      if (currentIndexRef.current < totalRoute.length - 1) {
        const currentPos = totalRoute[currentIndexRef.current];
        const nextPos = totalRoute[currentIndexRef.current + 1];
        
        // Calculate rotation based on direction (facing towards destination)
        const angle = Math.atan2(
          nextPos[1] - currentPos[1], // lng diff for x
          nextPos[0] - currentPos[0]  // lat diff for y
        ) * (180 / Math.PI);
        
        // Calculate actual distance in km using haversine formula
        const distanceKm = calculateDistance(currentPos[0], currentPos[1], nextPos[0], nextPos[1]);
        const simulatedSpeed = Math.max(10, Math.min(80, distanceKm * 1800)); // speed in km/h, assuming 2s interval
        
        setVehicleData({
          position: currentPos,
          rotation: angle,
          speed: simulatedSpeed,
          isMoving: true
        });
        
        currentIndexRef.current++;
      } else {
        // Reached destination
        setVehicleData(prev => ({
          ...prev,
          isMoving: false,
          speed: 0
        }));
        isSimulatingRef.current = false;
      }
    };

    const movementInterval = setInterval(simulateMovement, 3000); // Slower movement for better visibility
    
    return () => {
      clearInterval(movementInterval);
      isSimulatingRef.current = false;
    };
  }, [currentLocation, routePath]);

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
      <style jsx>{`
        .animated-truck {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>
      
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%', minHeight: '500px', borderRadius: '0.75rem' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater center={center} zoom={zoom} routePath={routePath} remainingPath={remainingPath} />
        
        {/* Start Point */}
        {startPoint && typeof startPoint.lat === 'number' && typeof startPoint.lng === 'number' && 
         startPoint.lat >= -90 && startPoint.lat <= 90 && startPoint.lng >= -180 && startPoint.lng <= 180 && (
          <Marker position={[startPoint.lat, startPoint.lng]} icon={defaultIcon}>
            <Popup>
              <div className="text-center">
                <strong className="block text-green-600">📍 Origin</strong>
                <p className="text-sm">{startPoint.label}</p>
                <p className="text-xs text-gray-500">
                  {startPoint.timestamp ? formatTimestamp(startPoint.timestamp) : new Date().toLocaleString()}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* End Point */}
        {endPoint && typeof endPoint.lat === 'number' && typeof endPoint.lng === 'number' && 
         endPoint.lat >= -90 && endPoint.lat <= 90 && endPoint.lng >= -180 && endPoint.lng <= 180 && (
          <Marker position={[endPoint.lat, endPoint.lng]} icon={defaultIcon}>
            <Popup>
              <div className="text-center">
                <strong className="block text-red-600">🎯 Destination</strong>
                <p className="text-sm">{endPoint.label}</p>
                <p className="text-xs text-gray-500">
                  {endPoint.timestamp ? `Estimated: ${formatTimestamp(endPoint.timestamp)}` : `Estimated arrival: ${new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleString()}`}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Animated Vehicle */}
        {(currentLocation || vehicleData.isMoving) && (
          <AnimatedVehicle 
            position={vehicleData.position}
            rotation={vehicleData.rotation}
            speed={vehicleData.speed}
          />
        )}

        {/* Check-in Points */}
        {checkIns.map((checkIn, idx) => (
          typeof checkIn.lat === 'number' && typeof checkIn.lng === 'number' && 
          checkIn.lat >= -90 && checkIn.lat <= 90 && checkIn.lng >= -180 && checkIn.lng <= 180 ? (
            <Marker key={idx} position={[checkIn.lat, checkIn.lng]} icon={defaultIcon} opacity={0.6}>
              <Popup>
                <span className="font-bold">✅ Check-in {idx + 1}</span><br/>
                {checkIn.label}<br/>
                <span className="text-xs">{formatTimestamp(checkIn.timestamp)}</span>
              </Popup>
            </Marker>
          ) : null
        ))}

        {/* Route Lines */}
        {routePath && routePath.length > 1 && (
          <>
            <Polyline 
              positions={routePath.map(coord => [coord[0], coord[1]])} 
              color="#2563eb" 
              weight={4} 
              opacity={0.8} 
            />
            <Polyline 
              positions={routePath.map(coord => [coord[0], coord[1]])} 
              color="#ffffff" 
              weight={2} 
              opacity={0.9}
              dashArray="10, 5"
            />
          </>
        )}

        {/* Remaining Path */}
        {remainingPath && remainingPath.length > 0 && (
          <Polyline 
            positions={remainingPath.map(coord => [coord[0], coord[1]])} 
            color="#ff0000" 
            weight={3} 
              opacity={0.6} 
              dashArray="10, 10"
          />
        )}

        {/* Current Location Marker */}
        {currentLocation && typeof currentLocation.lat === 'number' && typeof currentLocation.lng === 'number' && 
         currentLocation.lat >= -90 && currentLocation.lat <= 90 && currentLocation.lng >= -180 && currentLocation.lng <= 180 && (
          <Marker position={[currentLocation.lat, currentLocation.lng]} icon={defaultIcon}>
            <Popup>
              <div className="text-center">
                <strong className="block text-blue-600">📍 Current Location</strong>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(currentLocation.timestamp)}
                </span>
                <p className="text-sm">{currentLocation.label}</p>
                <div className="mt-2 p-2 bg-blue-50 rounded">
                  <div className="text-xs font-medium text-blue-700">
                    {vehicleData.isMoving ? (
                      <>
                        <div className="animate-pulse">🚚 Vehicle Moving</div>
                        <div>Speed: {vehicleData.speed.toFixed(0)} km/h</div>
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
