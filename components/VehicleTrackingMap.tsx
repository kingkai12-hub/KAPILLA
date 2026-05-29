'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, Marker, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Truck, LocateFixed, Eye, Radio } from 'lucide-react';
import { EnhancedTrackingMapLayers } from './EnhancedTrackingMap';
import { DynamicRoutePolyline } from './DynamicRoutePolyline';
import { ClientSideTracker } from '@/lib/client-side-tracking';

function AnimatedVehicleMarker({ position, rotation }: { position: [number, number]; rotation: number }) {
  return (
    <Marker
      position={position}
      icon={L.divIcon({
        html: `<div style="transform: rotate(${rotation}deg);">
                 <svg width="36" height="36" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                   <g>
                     <rect x="14" y="10" width="36" height="44" rx="8" ry="8" fill="#2563eb" stroke="white" stroke-width="3"/>
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
  arrived?: boolean;
  segments: {
    id: string;
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    isCompleted: boolean;
  }[];
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toR = (d: number) => (d * Math.PI) / 180;
  const dLat = toR(lat2 - lat1);
  const dLng = toR(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function advanceAlongRoute(routePoints: [number, number][], startLat: number, startLng: number, distanceMeters: number): [number, number] {
  if (!routePoints || routePoints.length < 2 || distanceMeters <= 0) return [startLat, startLng];
  let closestIdx = 0;
  let minD = Infinity;
  for (let i = 0; i < routePoints.length; i++) {
    const d = haversineM(startLat, startLng, routePoints[i][0], routePoints[i][1]);
    if (d < minD) { minD = d; closestIdx = i; }
  }
  let curLat = startLat;
  let curLng = startLng;
  let remaining = distanceMeters;
  let idx = Math.min(closestIdx + 1, routePoints.length - 1);
  while (remaining > 0 && idx < routePoints.length) {
    const segLen = haversineM(curLat, curLng, routePoints[idx][0], routePoints[idx][1]);
    if (segLen <= 0) { idx++; continue; }
    if (segLen <= remaining) {
      curLat = routePoints[idx][0]; curLng = routePoints[idx][1];
      remaining -= segLen; idx++;
    } else {
      const ratio = remaining / segLen;
      curLat = curLat + (routePoints[idx][0] - curLat) * ratio;
      curLng = curLng + (routePoints[idx][1] - curLng) * ratio;
      remaining = 0;
    }
  }
  return [curLat, curLng];
}

function MapController({ position, followMode }: { position: [number, number]; followMode: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (followMode) {
      map.setView(position, map.getZoom(), { animate: true, duration: 1 });
      if (map.getZoom() < 13) map.setZoom(14, { animate: true });
    }
  }, [position, followMode, map]);
  return null;
}

export default function VehicleTrackingMap({ waybillNumber }: { waybillNumber: string }) {
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [followMode, setFollowMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [showArrivalPopup, setShowArrivalPopup] = useState(false);
  const arrivalShownRef = useRef(false);

  const anchorRef = useRef<{
    lat: number; lng: number; speedKmh: number; heading: number;
    routePoints: [number, number][] | null; receivedAt: number; arrived: boolean;
  } | null>(null);

  const [displayPos, setDisplayPos] = useState<[number, number]>([0, 0]);
  const [displayHeading, setDisplayHeading] = useState(0);
  const lastRenderPos = useRef<[number, number]>([0, 0]);
  const clientTrackerRef = useRef<ClientSideTracker | null>(null);
  const displayPosRef = useRef<[number, number]>([0, 0]);

  useEffect(() => { displayPosRef.current = displayPos; }, [displayPos]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    setIsLiveTracking(false);
    return () => { clientTrackerRef.current?.stop(); };
  }, [waybillNumber]);

  const handleTrackingData = (data: TrackingData) => {
    setTracking(data);
    setErrorText(null);
    if (data.arrived && !arrivalShownRef.current) {
      arrivalShownRef.current = true;
      setShowArrivalPopup(true);
    }
    anchorRef.current = {
      lat: data.currentLat, lng: data.currentLng,
      speedKmh: data.speed || 0, heading: data.heading || 0,
      routePoints: data.routePoints || null,
      receivedAt: Date.now(), arrived: !!data.arrived,
    };
    if (displayPosRef.current[0] === 0 && displayPosRef.current[1] === 0) {
      setDisplayPos([data.currentLat, data.currentLng]);
      lastRenderPos.current = [data.currentLat, data.currentLng];
    }
  };

  useEffect(() => {
    const state = { sseActive: false, pollingActive: false, isCleaningUp: false };
    const fetchData = async () => {
      if (state.isCleaningUp) return;
      try {
        const res = await fetch(`/api/tracking?waybillNumber=${waybillNumber}&t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) { setErrorText(`Unable to load tracking (${res.status})`); setTracking(null); }
        else { handleTrackingData(await res.json()); }
      } catch { if (!state.isCleaningUp) setErrorText('Connection issue. Retrying...'); }
      finally { setLoading(false); }
    };

    let es: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;
    let fallbackTimer: NodeJS.Timeout | null = null;
    let heartbeatTimer: NodeJS.Timeout | null = null;
    let lastMsg = Date.now();

    const startPolling = () => {
      if (state.pollingActive || state.isCleaningUp) return;
      state.pollingActive = true; fetchData();
      pollInterval = setInterval(fetchData, 15000);
    };
    const stopPolling = () => { if (pollInterval) { clearInterval(pollInterval); pollInterval = null; state.pollingActive = false; } };
    const cleanupSSE = () => {
      if (es) {
        es.onopen = null; es.onmessage = null; es.onerror = null;
        if (es.readyState !== EventSource.CLOSED) { try { es.close(); } catch {} }
        es = null; state.sseActive = false;
      }
    };

    fetchData();
    try {
      es = new EventSource(`/api/tracking/stream?waybillNumber=${encodeURIComponent(waybillNumber)}`);
      es.onopen = () => {
        state.sseActive = true; lastMsg = Date.now(); stopPolling();
        heartbeatTimer = setInterval(() => {
          if (Date.now() - lastMsg > 30000 && state.sseActive) { cleanupSSE(); startPolling(); }
        }, 5000);
      };
      es.onmessage = (evt) => { lastMsg = Date.now(); try { handleTrackingData(JSON.parse(evt.data)); } catch {} };
      es.onerror = () => { if (!state.isCleaningUp) { cleanupSSE(); startPolling(); } };
      fallbackTimer = setTimeout(() => { if (!state.sseActive && !state.isCleaningUp) { cleanupSSE(); startPolling(); } }, 3000);
    } catch { startPolling(); }

    return () => {
      state.isCleaningUp = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      stopPolling(); cleanupSSE();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waybillNumber]);

  // Smooth animation — extrapolate position from anchor using speed every frame
  useEffect(() => {
    let raf: number;
    let frame = 0;
    const animate = () => {
      const anchor = anchorRef.current;
      if (anchor && !anchor.arrived && anchor.speedKmh > 0) {
        const elapsed = (Date.now() - anchor.receivedAt) / 1000;
        const dist = (anchor.speedKmh / 3.6) * elapsed;
        let lat: number, lng: number;
        if (anchor.routePoints && anchor.routePoints.length > 1) {
          [lat, lng] = advanceAlongRoute(anchor.routePoints, anchor.lat, anchor.lng, dist);
        } else {
          const hr = (anchor.heading * Math.PI) / 180;
          const mpd = 111320;
          lat = anchor.lat + (dist * Math.cos(hr)) / mpd;
          lng = anchor.lng + (dist * Math.sin(hr)) / (mpd * Math.cos((anchor.lat * Math.PI) / 180));
        }
        frame++;
        if (frame % 4 === 0) {
          if (Math.abs(lat - lastRenderPos.current[0]) > 0.000001 || Math.abs(lng - lastRenderPos.current[1]) > 0.000001) {
            setDisplayPos([lat, lng]);
            setDisplayHeading(anchor.heading);
            lastRenderPos.current = [lat, lng];
          }
        }
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  const completedSegments = useMemo(
    () => tracking?.segments?.filter((s) => s.isCompleted).map((s) => [[s.startLat, s.startLng], [s.endLat, s.endLng]]) || [],
    [tracking?.segments]
  );
  const remainingSegments = useMemo(
    () => tracking?.segments?.filter((s) => !s.isCompleted).map((s) => [[s.startLat, s.startLng], [s.endLat, s.endLng]]) || [],
    [tracking?.segments]
  );
  const sampledRoute = useMemo(() => {
    if (!tracking?.routePoints || tracking.routePoints.length < 2) return null;
    return tracking.routePoints;
  }, [tracking?.routePoints]);

  if (loading)
    return (
      <div className="h-[600px] w-full flex items-center justify-center bg-slate-100 rounded-3xl border-4 border-white shadow-inner">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-black uppercase tracking-widest text-sm">Initializing GPS...</p>
        </div>
      </div>
    );

  if (!tracking)
    return (
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
      {isLiveTracking && (
        <div className="absolute top-3 left-3 z-[1000] pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-full shadow-lg text-xs font-bold">
            <Radio className="w-4 h-4 animate-pulse" /><span>LIVE</span>
          </div>
        </div>
      )}
      <div className={`absolute ${isMobile ? 'top-3 right-3' : 'top-6 right-6'} z-[1000] flex justify-end items-start pointer-events-none`}>
        <div className="pointer-events-auto">
          <button
            onClick={() => setFollowMode(!followMode)}
            className={`flex items-center gap-2 ${isMobile ? 'px-4 py-3 text-[10px]' : 'px-6 py-4 text-xs'} rounded-3xl font-black uppercase tracking-widest transition-all shadow-2xl hover:scale-105 active:scale-95 touch-manipulation ${followMode ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
          >
            {followMode ? <LocateFixed className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            {followMode ? 'Following' : 'Free View'}
          </button>
        </div>
      </div>

      <MapContainer
        center={[tracking.currentLat, tracking.currentLng]}
        zoom={isMobile ? 15 : 16}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        preferCanvas={true}
        touchZoom={isMobile}
        dragging={true}
        doubleClickZoom={!isMobile}
      >
        <EnhancedTrackingMapLayers routePoints={tracking.routePoints} showLandmarks={true} />
        {sampledRoute && sampledRoute.length > 1 && (
          <DynamicRoutePolyline routePoints={sampledRoute} currentPosition={displayPos} completedColor="#2563eb" remainingColor="#ef4444" completedWeight={8} remainingWeight={6} completedOpacity={0.9} remainingOpacity={0.5} showProgress={true} />
        )}
        {!tracking?.routePoints && completedSegments.length > 0 && (
          <>
            {completedSegments.map((pos, idx) => (
              <DynamicRoutePolyline key={`c-${idx}`} routePoints={pos as [number, number][]} currentPosition={displayPos} completedColor="#2563eb" remainingColor="#2563eb" completedWeight={8} remainingWeight={8} completedOpacity={0.9} remainingOpacity={0.9} showProgress={false} />
            ))}
            {remainingSegments.map((pos, idx) => (
              <DynamicRoutePolyline key={`r-${idx}`} routePoints={pos as [number, number][]} currentPosition={displayPos} completedColor="#ef4444" remainingColor="#ef4444" completedWeight={6} remainingWeight={6} completedOpacity={0.5} remainingOpacity={0.5} showProgress={false} />
            ))}
          </>
        )}
        <AnimatedVehicleMarker position={displayPos} rotation={displayHeading} />
        <CircleMarker center={displayPos} radius={4} color="#2563eb" opacity={0.9} fillOpacity={1} />
        <MapController position={displayPos} followMode={followMode} />
      </MapContainer>

      {showArrivalPopup && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 mx-4 max-w-sm w-full text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Cargo Arrived!</h2>
            <p className="text-slate-600 text-sm mb-1">Shipment <span className="font-bold text-blue-600">#{waybillNumber}</span> has reached its destination.</p>
            <p className="text-slate-500 text-xs mb-6">A notification has been sent to the sender and receiver.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowArrivalPopup(false)} className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-colors text-sm">Confirm Arrival</button>
              <button onClick={() => setShowArrivalPopup(false)} className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors text-sm">Dismiss</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
