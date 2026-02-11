"use client";

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

interface SimpleMapProps {
  center?: [number, number];
  zoom?: number;
  startPoint?: { lat: number; lng: number; label?: string };
  endPoint?: { lat: number; lng: number; label?: string };
}

export default function SimpleTestMap({ center = [-6.8151812, 39.2864692], zoom = 6, startPoint, endPoint }: SimpleMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  console.log('🗺️ SimpleTestMap rendering:', { center, zoom, startPoint, endPoint });

  try {
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
          
          {startPoint && (
            <Marker position={[startPoint.lat, startPoint.lng]}>
              <Popup>
                <div className="text-center">
                  <strong className="block text-green-600">📍 Origin</strong>
                  <p className="text-sm">{startPoint.label || 'Start Point'}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {endPoint && (
            <Marker position={[endPoint.lat, endPoint.lng]}>
              <Popup>
                <div className="text-center">
                  <strong className="block text-red-600">🎯 Destination</strong>
                  <p className="text-sm">{endPoint.label || 'End Point'}</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    );
  } catch (error) {
    console.error('❌ SimpleTestMap error:', error);
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
