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
        const res = await fetch(`/api/tracking?waybillNumber=${waybillNumber}`, { cache: 'no-store' });
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
    const interval = setInterval(fetchTrackingData, 3000); // Update every 3 seconds to match simulation steps
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

  // Calculate rotation based on heading or segment direction
  const rotation = tracking.heading || 0;

  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden shadow-2xl border-4 border-white group">
      {/* Map Header Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-3 rounded-xl shadow-inner">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-tighter mb-0.5">Live Tracking</p>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <p className="text-lg font-black text-slate-900 leading-none">
                    {Math.round(tracking.speed)} <span className="text-xs font-bold text-slate-500">KM/H</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pointer-events-auto">
          <button 
            onClick={() => setFollowMode(!followMode)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm transition-all shadow-xl hover:scale-105 active:scale-95 ${
              followMode 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {followMode ? <LocateFixed className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            {followMode ? 'FOLLOWING' : 'FREE VIEW'}
          </button>
        </div>
      </div>

      <MapContainer 
        center={[tracking.currentLat, tracking.currentLng]} 
        zoom={16} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Remaining Path - RED (Dashed) */}
        {remainingSegments.map((pos, idx) => (
          <Polyline key={`rem-${idx}`} positions={pos as any} color="#ef4444" weight={6} opacity={0.6} dashArray="12, 12" />
        ))}

        {/* Completed Path - BLUE (Solid) */}
        {completedSegments.map((pos, idx) => (
          <Polyline key={`comp-${idx}`} positions={pos as any} color="#2563eb" weight={8} opacity={0.9} lineCap="round" lineJoin="round" />
        ))}

        {/* Vehicle Marker */}
        <Marker 
          position={[tracking.currentLat, tracking.currentLng]} 
          icon={L.divIcon({
            html: `<div class="bg-blue-600 p-2.5 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)] border-4 border-white transition-all duration-700 ease-in-out" style="transform: rotate(${rotation}deg)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 18H3c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v3"/><path d="M14 9l4-4 4 4"/><path d="M18 5v12"/><rect x="10" y="13" width="12" height="7" rx="2"/></svg>
                  </div>`,
            className: 'vehicle-marker',
            iconSize: [44, 44],
            iconAnchor: [22, 22]
          })}
        />

        <MapController 
          position={[tracking.currentLat, tracking.currentLng]} 
          followMode={followMode}
          isUrban={isUrban}
          userInteracted={() => setFollowMode(false)}
        />
      </MapContainer>

      {/* Speed & Environment Indicator */}
      <div className="absolute bottom-6 left-6 z-[1000] pointer-events-none flex flex-col gap-2">
        <div className="bg-slate-900/80 backdrop-blur-md text-white px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase border border-white/10">
          {isUrban ? '🏙️ URBAN ZONE (SPEED LIMITED)' : '🛣️ HIGHWAY MODE (OPTIMIZED)'}
        </div>
        {tracking.speed > 80 && (
          <div className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase animate-bounce shadow-2xl">
            ⚠️ CAUTION: HIGH SPEED
          </div>
        )}
      </div>
    </div>
  );
}
