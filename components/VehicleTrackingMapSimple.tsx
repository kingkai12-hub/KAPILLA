"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

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
  currentLocation?: Location | null;
  routePath?: [number, number][];
  remainingPath?: [number, number][];
  checkIns?: Location[];
}

function MapController({ center, zoom }: { 
  center?: [number, number]; 
  zoom?: number; 
}) {
  const map = useMap();
  const defaultCenter: [number, number] = [-6.8151812, 39.2864692];
  const defaultZoom = 12;

  useEffect(() => {
    if (map && center) {
      map.setView(center, zoom ?? defaultZoom, { animate: false });
    }
  }, [center, zoom, map]);

  return null;
}

export default function VehicleTrackingMapSimple({ 
  center = [-6.3690, 34.8888], 
  zoom = 6, 
  startPoint, 
  endPoint, 
  currentLocation, 
  routePath = [], 
  remainingPath = [], 
  checkIns = []
}: MapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  if (!isClient) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  try {
    return (
      <MapContainer 
        center={center} 
        zoom={zoom} 
        className="w-full h-full"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} zoom={zoom} />

        {/* Start Point */}
        {startPoint && (
          <Marker position={[startPoint.lat, startPoint.lng]} icon={defaultIcon}>
            <Popup>
              <span className="font-bold">📍 Start: {startPoint.label}</span>
            </Popup>
          </Marker>
        )}

        {/* End Point */}
        {endPoint && (
          <Marker position={[endPoint.lat, endPoint.lng]} icon={defaultIcon}>
            <Popup>
              <span className="font-bold">🎯 End: {endPoint.label}</span>
            </Popup>
          </Marker>
        )}

        {/* Current Location */}
        {currentLocation && (
          <Marker position={[currentLocation.lat, currentLocation.lng]} icon={defaultIcon}>
            <Popup>
              <span className="font-bold">🚚 Current Location</span><br/>
              {currentLocation.label}<br/>
              <span className="text-xs">{currentLocation.timestamp}</span>
            </Popup>
          </Marker>
        )}

        {/* Route Path */}
        {routePath.length > 1 && (
          <Polyline 
            positions={routePath} 
            color="#2563eb" 
            weight={3} 
            opacity={0.8}
          />
        )}

        {/* Remaining Path */}
        {remainingPath.length > 1 && (
          <Polyline 
            positions={remainingPath} 
            color="#dc2626" 
            weight={3} 
            opacity={0.6}
            dashArray="10, 5"
          />
        )}

        {/* Check-ins */}
        {checkIns.map((checkIn, idx) => (
          <Marker key={idx} position={[checkIn.lat, checkIn.lng]} icon={defaultIcon} opacity={0.6}>
            <Popup>
              <span className="font-bold">✅ Check-in {idx + 1}</span><br/>
              {checkIn.label}<br/>
              <span className="text-xs">{checkIn.timestamp}</span>
            </Popup>
          </Marker>
        ))}

      </MapContainer>
    );
  } catch (error) {
    console.error('VehicleTrackingMapSimple error:', error);
    return (
      <div className="w-full h-full bg-red-50 flex items-center justify-center">
        <div className="text-red-500 text-center">
          <div className="font-bold">Map Error</div>
          <div className="text-sm">Unable to load map</div>
        </div>
      </div>
    );
  }
}
