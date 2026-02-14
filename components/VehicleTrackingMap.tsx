"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Truck, Navigation, LocateFixed, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Fix Leaflet icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// Custom component for the animated marker
function AnimatedVehicleMarker({ position, rotation, isUrban }: { position: [number, number], rotation: number, isUrban: boolean }) {
  const map = useMap();
  
  return (
    <Marker 
      position={position} 
      icon={L.divIcon({
        html: `<div class="vehicle-container">
                <div class="bg-blue-600 p-2.5 rounded-full shadow-[0_0_25px_rgba(37,99,235,0.6)] border-4 border-white" style="transform: rotate(${rotation}deg)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 18H3c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v3"/><path d="M14 9l4-4 4 4"/><path d="M18 5v12"/><rect x="10" y="13" width="12" height="7" rx="2"/></svg>
                </div>
              </div>`,
        className: 'vehicle-marker-icon',
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      })}
    />
  );
}

interface RoutePoint {
  lat: number;
  lng: number;
}

interface TrackingData {
  currentLat: number;
  currentLng: number;
  speed: number;
  heading: number;
  isSimulated?: boolean;
  serverTime?: string;
  routePoints?: [number, number][];
  segments: {
    id: string;
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

  useEffect(() => {
    if (followMode) {
      const targetZoom = isUrban ? 16 : 14;
      map.setView(position, map.getZoom(), { animate: true, duration: 1 });
      
      if (map.getZoom() < 13) {
        map.setZoom(targetZoom, { animate: true });
      }
    }
  }, [position, followMode, isUrban, map]);

  return null;
}

export default function VehicleTrackingMap({ waybillNumber }: { waybillNumber: string }) {
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [followMode, setFollowMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isUrban, setIsUrban] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  // Use refs for smooth client-side interpolation
  const currentPos = useRef<[number, number]>([0, 0]);
  const [displayPos, setDisplayPos] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        const res = await fetch(`/api/tracking?waybillNumber=${waybillNumber}&t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) {
          setErrorText(`Unable to load tracking (Status: ${res.status})`);
          setTracking(null);
        } else {
          const data = await res.json();
          setTracking(data);
          setIsUrban(data.speed < 55);
          setErrorText(null);
          setLastUpdate(Date.now());
          
          // If this is the first load, set both positions
          if (currentPos.current[0] === 0) {
            currentPos.current = [data.currentLat, data.currentLng];
            setDisplayPos([data.currentLat, data.currentLng]);
          } else {
            currentPos.current = [data.currentLat, data.currentLng];
          }
        }
      } catch (error) {
        setErrorText('Connection issue. Retrying...');
      } finally {
        setLoading(false);
      }
    };

    fetchTrackingData();
    const interval = setInterval(fetchTrackingData, 1000); // Poll every 1 second
    return () => clearInterval(interval);
  }, [waybillNumber]);

  // Interpolation loop for smooth 60fps movement
  useEffect(() => {
    let animationFrame: number;
    
    const animate = () => {
      setDisplayPos(prev => {
        const target = currentPos.current;
        if (target[0] === 0) return prev;
        
        // Linear interpolation: move 10% towards target every frame
        // Slightly smoother visual motion while still responsive to server updates
        const lerpFactor = 0.10;
        
        // Calculate the actual distance
        const dLat = target[0] - prev[0];
        const dLng = target[1] - prev[1];
        
        // Only interpolate if the distance is small (to avoid jumping during resets)
        // If distance is large (> 0.1 degrees), jump directly to target
        if (Math.abs(dLat) > 0.1 || Math.abs(dLng) > 0.1) {
          return target;
        }
        
        // Threshold to stop oscillating
        if (Math.abs(dLat) < 0.0000001 && Math.abs(dLng) < 0.0000001) {
          return target;
        }

        const nextLat = prev[0] + dLat * lerpFactor;
        const nextLng = prev[1] + dLng * lerpFactor;
        
        return [nextLat, nextLng];
      });
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const completedSegments = useMemo(() => 
    tracking?.segments?.filter(s => s.isCompleted).map(s => [[s.startLat, s.startLng], [s.endLat, s.endLng]]) || [],
    [tracking?.segments]
  );

  const remainingSegments = useMemo(() => 
    tracking?.segments?.filter(s => !s.isCompleted).map(s => [[s.startLat, s.startLng], [s.endLat, s.endLng]]) || [],
    [tracking?.segments]
  );

  const routeBlue = useMemo(() => {
    if (!tracking?.routePoints || tracking.routePoints.length < 2) return null;
    let idx = 0;
    let minD = Infinity;
    for (let i = 0; i < tracking.routePoints.length; i++) {
      const dLat = tracking.routePoints[i][0] - displayPos[0];
      const dLng = tracking.routePoints[i][1] - displayPos[1];
      const d = dLat * dLat + dLng * dLng;
      if (d < minD) { minD = d; idx = i; }
    }
    return tracking.routePoints.slice(0, Math.max(1, idx + 1));
  }, [tracking?.routePoints, displayPos]);

  const routeRed = useMemo(() => {
    if (!tracking?.routePoints || tracking.routePoints.length < 2) return null;
    let idx = 0;
    let minD = Infinity;
    for (let i = 0; i < tracking.routePoints.length; i++) {
      const dLat = tracking.routePoints[i][0] - displayPos[0];
      const dLng = tracking.routePoints[i][1] - displayPos[1];
      const d = dLat * dLat + dLng * dLng;
      if (d < minD) { minD = d; idx = i; }
    }
    return tracking.routePoints.slice(Math.max(0, idx), tracking.routePoints.length);
  }, [tracking?.routePoints, displayPos]);

  if (loading) return (
    <div className="h-[600px] w-full flex items-center justify-center bg-slate-100 rounded-3xl border-4 border-white shadow-inner">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-black uppercase tracking-widest text-sm">Initializing GPS...</p>
      </div>
    </div>
  );

  if (!tracking) return (
    <div className="h-[600px] w-full flex items-center justify-center bg-slate-100 rounded-3xl border-4 border-white shadow-inner">
      <div className="text-center px-6">
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 inline-block">
          <Truck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-900 font-black uppercase tracking-tight mb-1">No Signal Detected</p>
          <p className="text-slate-500 text-xs font-bold uppercase">{errorText || 'Awaiting coordinates'}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-[600px] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-4 border-white group">
      {/* HUD OVERLAY */}
      <div className="absolute top-6 left-6 right-6 z-[1000] flex justify-between items-start pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/95 backdrop-blur-xl p-4 rounded-3xl shadow-2xl border border-slate-200 pointer-events-auto min-w-[200px]"
        >
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black text-slate-400 tracking-tighter mb-0.5">Live Velocity</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900 leading-none">
                  {Math.round(tracking.speed)}
                </span>
                <span className="text-xs font-black text-slate-400 uppercase">KM/H</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black text-slate-500 uppercase">Signal: Strong</span>
            </div>
            <span className="text-[10px] font-black text-blue-600 uppercase">Active</span>
          </div>
        </motion.div>

        <div className="pointer-events-auto">
          <button 
            onClick={() => setFollowMode(!followMode)}
            className={`flex items-center gap-3 px-6 py-4 rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-2xl hover:scale-105 active:scale-95 ${
              followMode 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {followMode ? <LocateFixed className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            {followMode ? 'Following' : 'Free View'}
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

        {/* Road-following route rendering if routePoints present */}
        {routeRed && routeRed.length > 1 && (
          <Polyline positions={routeRed as any} color="#ef4444" weight={6} opacity={0.5} dashArray="12, 12" />
        )}
        {routeBlue && routeBlue.length > 1 && (
          <Polyline positions={routeBlue as any} color="#2563eb" weight={8} opacity={0.9} lineCap="round" lineJoin="round" />
        )}
        {/* Fallback to segment-based rendering if routePoints missing */}
        {!tracking?.routePoints && remainingSegments.map((pos, idx) => (
          <Polyline key={`rem-${idx}`} positions={pos as any} color="#ef4444" weight={6} opacity={0.5} dashArray="12, 12" />
        ))}
        {!tracking?.routePoints && completedSegments.map((pos, idx) => (
          <Polyline key={`comp-${idx}`} positions={pos as any} color="#2563eb" weight={8} opacity={0.9} lineCap="round" lineJoin="round" />
        ))}

        <AnimatedVehicleMarker 
          position={displayPos} 
          rotation={tracking.heading || 0}
          isUrban={isUrban}
        />
        <CircleMarker center={displayPos} radius={4} color="#2563eb" opacity={0.9} fillOpacity={1} />

        <MapController 
          position={displayPos} 
          followMode={followMode}
          isUrban={isUrban}
          userInteracted={() => setFollowMode(false)}
        />
      </MapContainer>

      {/* Footer Indicators */}
      <div className="absolute bottom-8 left-8 z-[1000] pointer-events-none flex flex-col gap-3">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/90 backdrop-blur-xl text-white px-5 py-3 rounded-2xl text-[10px] font-black tracking-widest uppercase border border-white/10 flex items-center gap-3 shadow-2xl"
        >
          {isUrban ? '🏙️ Urban Transit Zone' : '🛣️ Highway Corridor'}
          <div className="h-1 w-12 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-1000" 
              style={{ width: `${(completedSegments.length / (completedSegments.length + remainingSegments.length)) * 100}%` }} 
            />
          </div>
        </motion.div>
        
        <div className="bg-white/90 text-slate-700 px-3 py-2 rounded-xl text-[10px] font-bold border border-slate-200 pointer-events-auto">
          <div>Lat: {displayPos[0].toFixed(5)} Lng: {displayPos[1].toFixed(5)}</div>
          <div>Segs: {(tracking?.segments?.length ?? 0)} Speed: {Math.round(tracking.speed)}</div>
          <div>Updated: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : '—'}</div>
        </div>
        
        {tracking.speed > 80 && (
          <div className="bg-red-600/90 backdrop-blur-xl text-white px-5 py-3 rounded-2xl text-[10px] font-black tracking-widest uppercase animate-bounce shadow-2xl border border-red-400/50">
            ⚠️ Velocity Alert: High Speed
          </div>
        )}
      </div>
    </div>
  );
}
