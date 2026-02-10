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

// Vehicle Component with clean, predictable behavior
function VehicleMarker({ position, speed }: { position: [number, number]; speed: number }) {
  const vehicleIcon = L.divIcon({
    html: `
      <div style="
        position: relative;
        width: 20px;
        height: 20px;
        z-index: 1000;
      ">
        <div style="
          position: absolute;
          width: 16px;
          height: 16px;
          background: #dc2626;
          border-radius: 50%;
          top: 2px;
          left: 2px;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
        <div style="
          position: absolute;
          width: 20px;
          height: 20px;
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
    className: 'vehicle-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  return (
    <Marker position={position} icon={vehicleIcon}>
      <Popup>
        <div className="text-center p-2 bg-white rounded">
          <div className="font-bold text-red-600">Vehicle</div>
          <div className="text-sm">Speed: {speed.toFixed(0)} km/h</div>
          <div className="text-xs text-gray-500">{new Date().toLocaleTimeString()}</div>
        </div>
      </Popup>
    </Marker>
  );
}

function MapUpdater({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap();
  const defaultCenter: [number, number] = [-6.8151812, 39.2864692]; // Office location
  const defaultZoom = 12;

  useEffect(() => {
    if (!map) return;

    const effectiveCenter = center || defaultCenter;
    const effectiveZoom = zoom ?? defaultZoom;

    map.setView(effectiveCenter, effectiveZoom);
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

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Simple vehicle movement logic
  useEffect(() => {
    if (currentLocation) {
      // If there's a current location, use it
      setVehiclePosition([currentLocation.lat, currentLocation.lng]);
      setVehicleSpeed(45 + Math.random() * 10); // Random speed between 45-55 km/h
    } else if (routePath.length > 0) {
      // If no current location but there's a route, use first point
      setVehiclePosition(routePath[0]);
      setVehicleSpeed(50);
    }
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
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%', minHeight: '500px', borderRadius: '0.75rem' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater center={center} zoom={zoom} />
        
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

        {/* Vehicle */}
        <VehicleMarker position={vehiclePosition} speed={vehicleSpeed} />

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

        {/* Traveled Path - Blue Solid Line */}
        {routePath && routePath.length > 1 && (
          <Polyline 
            positions={routePath} 
            color="#2563eb" 
            weight={4} 
            opacity={0.8}
            smoothFactor={1}
          />
        )}

        {/* Remaining Path - Red Dotted Line */}
        {remainingPath && remainingPath.length > 1 && (
          <Polyline 
            positions={remainingPath} 
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
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
