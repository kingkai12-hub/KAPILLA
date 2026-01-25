"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

// Fix for default marker icons in Next.js/React-Leaflet
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

// Custom truck icon
const truckIconUrl = 'https://cdn-icons-png.flaticon.com/512/759/759739.png';

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
  routePath?: [number, number][]; // Array of [lat, lng]
  checkIns?: Location[];
}

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function LeafletMap({ 
  center = [-6.3690, 34.8888], // Tanzania Center
  zoom = 6,
  startPoint,
  endPoint,
  currentLocation,
  routePath = [],
  checkIns = []
}: MapProps) {
  
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Fix icons on client side
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
    });
  }, []);

  const truckIcon = L.icon({
    iconUrl: truckIconUrl,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });

  const defaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
  });

  if (!isClient) return null;

  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      style={{ height: '100%', width: '100%', minHeight: '400px', borderRadius: '0.75rem' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapUpdater center={center} zoom={zoom} />

      {startPoint && (
        <Marker position={[startPoint.lat, startPoint.lng]} icon={defaultIcon}>
          <Popup>Start: {startPoint.label}</Popup>
        </Marker>
      )}

      {endPoint && (
        <Marker position={[endPoint.lat, endPoint.lng]} icon={defaultIcon}>
          <Popup>Destination: {endPoint.label}</Popup>
        </Marker>
      )}

      {currentLocation && (
        <Marker position={[currentLocation.lat, currentLocation.lng]} icon={truckIcon}>
          <Popup>
            <div className="text-center">
              <strong className="block text-blue-600">Current Location</strong>
              <span className="text-xs text-gray-500">{currentLocation.timestamp}</span>
              <p className="text-sm">{currentLocation.label}</p>
            </div>
          </Popup>
        </Marker>
      )}

      {checkIns.map((checkIn, idx) => (
        <Marker key={idx} position={[checkIn.lat, checkIn.lng]} icon={defaultIcon} opacity={0.6}>
          <Popup>
            <span className="font-bold">Check-in {idx + 1}</span><br/>
            {checkIn.label}<br/>
            <span className="text-xs">{checkIn.timestamp}</span>
          </Popup>
        </Marker>
      ))}

      {routePath.length > 0 && (
        <Polyline 
          positions={routePath} 
          color="#2563eb" 
          weight={4} 
          opacity={0.7} 
          dashArray="10, 10" 
        />
      )}
    </MapContainer>
  );
}
