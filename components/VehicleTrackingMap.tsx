"use client";

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Truck, Navigation, LocateFixed, Eye } from 'lucide-react';

// Fix Leaflet icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const VehicleIcon = L.divIcon({
  html: `<div class="bg-blue-600 p-2 rounded-full shadow-lg border-2 border-white transform rotate-0 transition-transform duration-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 18H3c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v3"/><path d="M14 9l4-4 4 4"/><path d="M18 5v12"/><rect x="10" y="13" width="12" height="7" rx="2"/></svg>
        </div>`,
  className: 'vehicle-marker',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

interface RoutePoint {
  lat: number;
  lng: number;
}

interface TrackingData {
  currentLat: number;
  currentLng: number;
  speed: number;
  heading: number;
  routePoints: [number, number][];
  segments: {
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    isCompleted: boolean;
  }[];
}

// Controller component for intelligent zoom and follow logic
function MapController({ 
  position, 
  followMode, 
  isUrban,
  userInteracted 
}: { 
  position: [number, number]; 
  followMode: boolean; 
  isUrban: boolean;
  userInteracted: () => void;
}) {
  const map = useMap();
  const lastPos = useRef<[number, number]>(position);

  // Detect user interaction to potentially disable follow mode if we wanted,
  // but for now we just respect the followMode prop.
  useMapEvents({
    dragstart: () => userInteracted(),
    zoomstart: () => userInteracted(),
  });

  useEffect(() => {
    if (followMode) {
      // Intelligent Zoom Level: 16 for urban, 14 for rural
      const targetZoom = isUrban ? 16 : 14;
      
      // Only pan/zoom if position changed significantly or first load
      if (Math.abs(lastPos.current[0] - position[0]) > 0.0001 || 
          Math.abs(lastPos.current[1] - position[1]) > 0.0001) {
        map.setView(position, map.getZoom(), { animate: true });
        
        // Only auto-zoom if we are not at the target zoom already
        if (map.getZoom() !== targetZoom && !userInteracted) {
          map.setZoom(targetZoom, { animate: true });
        }
      }
      lastPos.current = position;
    }
  }, [position, followMode, isUrban, map]);

  return null;
}

export default function VehicleTrackingMap({ waybillNumber }: { waybillNumber: string }) {
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [followMode, setFollowMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isUrban, setIsUrban] = useState(true);
  const [userHasZoomed, setUserHasZoomed] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        const res = await fetch(`/api/tracking?waybillNumber=${waybillNumber}`);
        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try {
            const data = await res.json();
            if (data?.error) msg = data.error;
          } catch {}
          setErrorText(msg);
          setTracking(null);
        } else {
          const data = await res.json();
          setTracking(data);
          setIsUrban(data.speed < 55);
          setErrorText(null);
        }
      } catch (error) {
        setErrorText('Network error while fetching tracking data');
      } finally {
        setLoading(false);
      }
    };

    fetchTrackingData();
    const interval = setInterval(fetchTrackingData, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, [waybillNumber]);

  if (loading) return <div className="h-[400px] w-full flex items-center justify-center bg-slate-100 rounded-xl">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 font-medium">Loading tracking map...</p>
    </div>
  </div>;

  if (!tracking) {
    return (
      <div className="h-[400px] w-full flex items-center justify-center bg-slate-100 rounded-xl">
        <div className="text-center">
          <p className="text-slate-700 font-semibold">Tracking data unavailable for this shipment.</p>
          {errorText && <p className="text-slate-500 text-sm mt-1">{errorText}</p>}
        </div>
      </div>
    );
  }

  const completedSegments = tracking.segments
    .filter(s => s.isCompleted)
    .map(s => [[s.startLat, s.startLng], [s.endLat, s.endLng]]);

  const remainingSegments = tracking.segments
    .filter(s => !s.isCompleted)
    .map(s => [[s.startLat, s.startLng], [s.endLat, s.endLng]]);

  return (
    <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
      {/* Map Header Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-between items-center pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-slate-200 pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">Status</p>
              <p className="text-sm font-bold text-slate-900 leading-none">Moving at {Math.round(tracking.speed)} km/h</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pointer-events-auto">
          <button 
            onClick={() => setFollowMode(!followMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shadow-lg ${
              followMode 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {followMode ? <LocateFixed className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {followMode ? 'Following' : 'Free View'}
          </button>
        </div>
      </div>

      <MapContainer 
        center={[tracking.currentLat, tracking.currentLng]} 
        zoom={15} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Completed Path - Blue */}
        {completedSegments.map((pos, idx) => (
          <Polyline key={`comp-${idx}`} positions={pos as any} color="#2563eb" weight={6} opacity={0.8} />
        ))}

        {/* Remaining Path - Red */}
        {remainingSegments.map((pos, idx) => (
          <Polyline key={`rem-${idx}`} positions={pos as any} color="#ef4444" weight={6} opacity={0.6} dashArray="10, 10" />
        ))}

        {/* Vehicle Marker */}
        <Marker 
          position={[tracking.currentLat, tracking.currentLng]} 
          icon={VehicleIcon}
        />

        <MapController 
          position={[tracking.currentLat, tracking.currentLng]} 
          followMode={followMode}
          isUrban={isUrban}
          userInteracted={() => setUserHasZoomed(true)}
        />
      </MapContainer>

      {/* Speed Warning Overlay if applicable */}
      {tracking.speed > 80 && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-bold animate-pulse">
          HIGH SPEED ALERT
        </div>
      )}
    </div>
  );
}
