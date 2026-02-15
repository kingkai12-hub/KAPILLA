'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, Marker, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Truck, LocateFixed, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { EnhancedTrackingMapLayers } from './EnhancedTrackingMap';
import { DynamicRoutePolyline } from './DynamicRoutePolyline';

// Custom component for the animated marker
function AnimatedVehicleMarker({
  position,
  rotation,
  isUrban,
}: {
  position: [number, number];
  rotation: number;
  isUrban: boolean;
}) {
  return (
    <Marker
      position={position}
      icon={L.divIcon({
        html: `<div style="transform: rotate(${rotation}deg);">
                 <svg width="36" height="36" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                   <g>
                     <rect x="14" y="10" width="36" height="44" rx="8" ry="8" fill="${isUrban ? '#2563eb' : '#0ea5e9'}" stroke="white" stroke-width="3"/>
                     <rect x="20" y="14" width="24" height="10" rx="4" ry="4" fill="white" opacity="0.9"/>
                     <circle cx="22" cy="54" r="4" fill="#111827" stroke="white" stroke-width="2"/>
                     <circle cx="42" cy="54" r="4" fill="#111827" stroke="white" stroke-width="2"/>
                     <rect x="18" y="26" width="28" height="18" rx="3" ry="3" fill="#1f2937" opacity="0.85"/>
                     <rect x="28" y="8" width="8" height="6" rx="2" ry="2" fill="#111827" />
                   </g>
                 </svg>
               </div>`,
        className: 'vehicle-marker-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      })}
    />
  );
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
}: {
  position: [number, number];
  followMode: boolean;
  isUrban: boolean;
}) {
  const map = useMap();

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

  const currentPos = useRef<[number, number]>([0, 0]);
  const [displayPos, setDisplayPos] = useState<[number, number]>([0, 0]);
  const tweenFrom = useRef<[number, number] | null>(null);
  const tweenTo = useRef<[number, number] | null>(null);
  const tweenStart = useRef<number>(0);
  const tweenEnd = useRef<number>(0);
  const displayRef = useRef<[number, number]>([0, 0]);
  useEffect(() => {
    displayRef.current = displayPos;
  }, [displayPos]);

  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        const res = await fetch(`/api/tracking?waybillNumber=${waybillNumber}&t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (!res.ok) {
          setErrorText(`Unable to load tracking (Status: ${res.status})`);
          setTracking(null);
        } else {
          const data = await res.json();
          setTracking(data);
          setIsUrban(data.speed < 55);
          setErrorText(null);
          setLastUpdate(Date.now());

          if (currentPos.current[0] === 0) {
            currentPos.current = [data.currentLat, data.currentLng];
            setDisplayPos([data.currentLat, data.currentLng]);
          } else {
            currentPos.current = [data.currentLat, data.currentLng];
            tweenFrom.current = displayRef.current;
            tweenTo.current = [data.currentLat, data.currentLng];
            const start = Date.now();
            tweenStart.current = start;
            tweenEnd.current = start + 1000;
          }
        }
      } catch {
        setErrorText('Connection issue. Retrying...');
      } finally {
        setLoading(false);
      }
    };

    // Try SSE first
    let es: EventSource | null = null;
    let sseConnected = false;
    let pollInterval: NodeJS.Timeout | null = null;

    try {
      es = new EventSource(
        `/api/tracking/stream?waybillNumber=${encodeURIComponent(waybillNumber)}`
      );

      es.onopen = () => {
        sseConnected = true;
        // Clear any polling if SSE connects
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      };

      es.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          setTracking(data);
          setIsUrban(data.speed < 55);
          setErrorText(null);
          setLastUpdate(Date.now());
          if (currentPos.current[0] === 0) {
            currentPos.current = [data.currentLat, data.currentLng];
            setDisplayPos([data.currentLat, data.currentLng]);
          } else {
            currentPos.current = [data.currentLat, data.currentLng];
            tweenFrom.current = displayRef.current;
            tweenTo.current = [data.currentLat, data.currentLng];
            const start = Date.now();
            tweenStart.current = start;
            tweenEnd.current = start + 1000;
          }
        } catch {}
      };

      es.onerror = () => {
        sseConnected = false;
        try {
          es?.close();
        } catch {
          /* ignore */
        }

        // Start polling fallback only if not already polling
        if (!pollInterval) {
          fetchTrackingData();
          pollInterval = setInterval(fetchTrackingData, 1000);
        }
      };
    } catch {
      sseConnected = false;
    }

    // Delayed polling fallback - only start if SSE didn't connect
    const fallbackTimer = setTimeout(() => {
      if (!sseConnected && !pollInterval) {
        fetchTrackingData();
        pollInterval = setInterval(fetchTrackingData, 1000);
      }
    }, 600);

    return () => {
      clearTimeout(fallbackTimer);
      if (pollInterval) clearInterval(pollInterval);
      if (es) {
        try {
          es.close();
        } catch {}
      }
    };
  }, [waybillNumber]);

  useEffect(() => {
    let animationFrame: number;

    const animate = () => {
      const from = tweenFrom.current;
      const to = tweenTo.current;
      if (from && to) {
        const now = Date.now();
        const start = tweenStart.current;
        const end = tweenEnd.current || start + 1000;
        const dur = Math.max(1, end - start);
        const t = Math.max(0, Math.min(1, (now - start) / dur));
        const lat = from[0] + (to[0] - from[0]) * t;
        const lng = from[1] + (to[1] - from[1]) * t;
        setDisplayPos([lat, lng]);
        if (t >= 1) {
          tweenFrom.current = [to[0], to[1]];
          tweenTo.current = null;
        }
      }
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const completedSegments = useMemo(
    () =>
      tracking?.segments
        ?.filter((s) => s.isCompleted)
        .map((s) => [
          [s.startLat, s.startLng],
          [s.endLat, s.endLng],
        ]) || [],
    [tracking?.segments]
  );

  const remainingSegments = useMemo(
    () =>
      tracking?.segments
        ?.filter((s) => !s.isCompleted)
        .map((s) => [
          [s.startLat, s.startLng],
          [s.endLat, s.endLng],
        ]) || [],
    [tracking?.segments]
  );

  const sampledRoute = useMemo(() => {
    if (!tracking?.routePoints || tracking.routePoints.length < 2) return null;
    const pts = tracking.routePoints;
    const step = Math.max(1, Math.floor(pts.length / 300));
    const out: [number, number][] = [];
    for (let i = 0; i < pts.length; i += step) out.push(pts[i]);
    const last = pts[pts.length - 1];
    const tail = out[out.length - 1];
    if (!tail || tail[0] !== last[0] || tail[1] !== last[1]) out.push(last);
    return out;
  }, [tracking?.routePoints]);

  const closestIndex = useMemo(() => {
    if (!sampledRoute || sampledRoute.length < 2) return 0;
    const lat = displayPos[0];
    const lng = displayPos[1];
    let idx = 0;
    let minD = Infinity;
    for (let i = 0; i < sampledRoute.length; i++) {
      const dLat = sampledRoute[i][0] - lat;
      const dLng = sampledRoute[i][1] - lng;
      const d = dLat * dLat + dLng * dLng;
      if (d < minD) {
        minD = d;
        idx = i;
      }
    }
    return idx;
  }, [sampledRoute, displayPos]);

  const routeBlue = useMemo(() => {
    if (!sampledRoute || sampledRoute.length < 2) return null;
    return sampledRoute.slice(0, Math.max(1, closestIndex + 1));
  }, [sampledRoute, closestIndex]);

  const routeRed = useMemo(() => {
    if (!sampledRoute || sampledRoute.length < 2) return null;
    return sampledRoute.slice(Math.max(0, closestIndex), sampledRoute.length);
  }, [sampledRoute, closestIndex]);

  if (loading)
    return (
      <div className="h-[600px] w-full flex items-center justify-center bg-slate-100 rounded-3xl border-4 border-white shadow-inner">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-black uppercase tracking-widest text-sm">
            Initializing GPS...
          </p>
        </div>
      </div>
    );

  if (!tracking)
    return (
      <div className="h-[600px] w-full flex items-center justify-center bg-slate-100 rounded-3xl border-4 border-white shadow-inner">
        <div className="text-center px-6">
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 inline-block">
            <Truck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-900 font-black uppercase tracking-tight mb-1">
              No Signal Detected
            </p>
            <p className="text-slate-500 text-xs font-bold uppercase">
              {errorText || 'Awaiting coordinates'}
            </p>
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
              <p className="text-[10px] uppercase font-black text-slate-400 tracking-tighter mb-0.5">
                Live Velocity
              </p>
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
              <span className="text-[10px] font-black text-slate-500 uppercase">
                Signal: Strong
              </span>
            </div>
            <span className="text-[10px] font-black text-blue-600 uppercase">Active</span>
          </div>
        </motion.div>

        <div className="pointer-events-auto">
          <button
            onClick={() => setFollowMode(!followMode)}
            className={`flex items-center gap-3 px-6 py-4 rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-2xl hover:scale-105 active:scale-95 ${
              followMode ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
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
        preferCanvas={true}
      >
        {/* Enhanced map layers with multiple tile options and landmarks */}
        <EnhancedTrackingMapLayers routePoints={tracking.routePoints} showLandmarks={true} />

        {/* Dynamic route polyline - single continuous line with dynamic recoloring */}
        {sampledRoute && sampledRoute.length > 1 && (
          <DynamicRoutePolyline
            routePoints={sampledRoute}
            currentPosition={displayPos}
            completedColor="#2563eb"
            remainingColor="#ef4444"
            completedWeight={8}
            remainingWeight={6}
            completedOpacity={0.9}
            remainingOpacity={0.5}
            showProgress={true}
          />
        )}

        {/* Fallback for segment-based routes (when routePoints not available) */}
        {!tracking?.routePoints && completedSegments.length > 0 && (
          <>
            {completedSegments.map((pos, idx) => (
              <DynamicRoutePolyline
                key={`comp-${idx}`}
                routePoints={pos as [number, number][]}
                currentPosition={displayPos}
                completedColor="#2563eb"
                remainingColor="#2563eb"
                completedWeight={8}
                remainingWeight={8}
                completedOpacity={0.9}
                remainingOpacity={0.9}
                showProgress={false}
              />
            ))}
            {remainingSegments.map((pos, idx) => (
              <DynamicRoutePolyline
                key={`rem-${idx}`}
                routePoints={pos as [number, number][]}
                currentPosition={displayPos}
                completedColor="#ef4444"
                remainingColor="#ef4444"
                completedWeight={6}
                remainingWeight={6}
                completedOpacity={0.5}
                remainingOpacity={0.5}
                showProgress={false}
              />
            ))}
          </>
        )}

        <AnimatedVehicleMarker
          position={displayPos}
          rotation={tracking.heading || 0}
          isUrban={isUrban}
        />
        <CircleMarker
          center={displayPos}
          radius={4}
          color="#2563eb"
          opacity={0.9}
          fillOpacity={1}
        />

        <MapController position={displayPos} followMode={followMode} isUrban={isUrban} />
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
              style={{
                width: `${(completedSegments.length / (completedSegments.length + remainingSegments.length)) * 100}%`,
              }}
            />
          </div>
        </motion.div>

        <div className="bg-white/90 text-slate-700 px-3 py-2 rounded-xl text-[10px] font-bold border border-slate-200 pointer-events-auto">
          <div>
            Lat: {displayPos[0].toFixed(5)} Lng: {displayPos[1].toFixed(5)}
          </div>
          <div>
            Segs: {tracking?.segments?.length ?? 0} Speed: {Math.round(tracking.speed)}
          </div>
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
