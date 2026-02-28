'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, Marker, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Truck, LocateFixed, Eye, Radio } from 'lucide-react';
import { EnhancedTrackingMapLayers } from './EnhancedTrackingMap';
import { DynamicRoutePolyline } from './DynamicRoutePolyline';
import { ClientSideTracker } from '@/lib/client-side-tracking';

// Custom component for the animated marker
function AnimatedVehicleMarker({
  position,
  rotation,
}: {
  position: [number, number];
  rotation: number;
}) {
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
}: {
  position: [number, number];
  followMode: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (followMode) {
      map.setView(position, map.getZoom(), { animate: true, duration: 1 });

      if (map.getZoom() < 13) {
        map.setZoom(14, { animate: true });
      }
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

  const currentPos = useRef<[number, number]>([0, 0]);
  const [displayPos, setDisplayPos] = useState<[number, number]>([0, 0]);
  const tweenFrom = useRef<[number, number] | null>(null);
  const tweenTo = useRef<[number, number] | null>(null);
  const tweenStart = useRef<number>(0);
  const tweenEnd = useRef<number>(0);
  const displayRef = useRef<[number, number]>([0, 0]);
  const lastRenderPos = useRef<[number, number]>([0, 0]);
  const clientTrackerRef = useRef<ClientSideTracker | null>(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile =
        window.innerWidth < 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    displayRef.current = displayPos;
  }, [displayPos]);

  // CLIENT-SIDE TRACKING: Start autonomous updates when component mounts
  useEffect(() => {
    console.log('[ClientTracker] Initializing for', waybillNumber);
    
    // Create and start tracker
    clientTrackerRef.current = new ClientSideTracker(waybillNumber, 60); // Update every 60 seconds
    clientTrackerRef.current.start();
    setIsLiveTracking(true);

    // Cleanup on unmount
    return () => {
      console.log('[ClientTracker] Cleaning up');
      clientTrackerRef.current?.stop();
      setIsLiveTracking(false);
    };
  }, [waybillNumber]);

  useEffect(() => {
    // Use refs to track connection state across renders
    const connectionStateRef = {
      current: {
        sseActive: false,
        pollingActive: false,
        isCleaningUp: false,
      },
    };

    const fetchTrackingData = async () => {
      // Don't fetch if cleaning up
      if (connectionStateRef.current.isCleaningUp) return;

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
          setErrorText(null);

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
        if (!connectionStateRef.current.isCleaningUp) {
          setErrorText('Connection issue. Retrying...');
        }
      } finally {
        setLoading(false);
      }
    };

    // SSE connection management
    let es: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;
    let fallbackTimer: NodeJS.Timeout | null = null;
    let heartbeatTimer: NodeJS.Timeout | null = null;
    let lastMessageTime = Date.now();

    const startPolling = () => {
      // Don't start if already polling or cleaning up
      if (connectionStateRef.current.pollingActive || connectionStateRef.current.isCleaningUp) {
        return;
      }

      console.log('[TRACKING] Starting polling fallback');
      connectionStateRef.current.pollingActive = true;
      fetchTrackingData();
      pollInterval = setInterval(fetchTrackingData, 1000);
    };

    const stopPolling = () => {
      if (pollInterval) {
        console.log('[TRACKING] Stopping polling');
        clearInterval(pollInterval);
        pollInterval = null;
        connectionStateRef.current.pollingActive = false;
      }
    };

    const cleanupSSE = () => {
      if (es) {
        console.log('[TRACKING] Cleaning up SSE connection');

        // Remove all event listeners first (prevents memory leaks)
        es.onopen = null;
        es.onmessage = null;
        es.onerror = null;

        // Close connection if not already closed
        if (es.readyState !== EventSource.CLOSED) {
          try {
            es.close();
          } catch (err) {
            console.error('[TRACKING] Error closing EventSource:', err);
          }
        }

        es = null;
        connectionStateRef.current.sseActive = false;
      }
    };

    // Heartbeat monitor - detects dead SSE connections
    const startHeartbeatMonitor = () => {
      heartbeatTimer = setInterval(() => {
        const timeSinceLastMessage = Date.now() - lastMessageTime;

        // If no message in 30 seconds, SSE is probably dead
        if (timeSinceLastMessage > 30000 && connectionStateRef.current.sseActive) {
          console.warn('[TRACKING] SSE heartbeat timeout, switching to polling');
          cleanupSSE();
          startPolling();
        }
      }, 5000); // Check every 5 seconds
    };

    // Initial fetch to show data immediately
    fetchTrackingData();

    // Initialize SSE connection
    try {
      console.log('[TRACKING] Attempting SSE connection');
      es = new EventSource(
        `/api/tracking/stream?waybillNumber=${encodeURIComponent(waybillNumber)}`
      );

      es.onopen = () => {
        console.log('[TRACKING] SSE connection established');
        connectionStateRef.current.sseActive = true;
        lastMessageTime = Date.now();

        // Stop polling if it was running
        stopPolling();

        // Start heartbeat monitor
        startHeartbeatMonitor();
      };

      es.onmessage = (evt) => {
        lastMessageTime = Date.now();

        try {
          const data = JSON.parse(evt.data);
          setTracking(data);
          setErrorText(null);

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
        } catch (err) {
          console.error('[TRACKING] Error parsing SSE message:', err);
        }
      };

      es.onerror = (err) => {
        console.error('[TRACKING] SSE error:', err);

        // Only switch to polling if not already cleaning up
        if (!connectionStateRef.current.isCleaningUp) {
          cleanupSSE();
          startPolling();
        }
      };

      // Fallback timer - start polling if SSE doesn't connect within 3 seconds
      fallbackTimer = setTimeout(() => {
        if (!connectionStateRef.current.sseActive && !connectionStateRef.current.isCleaningUp) {
          console.log('[TRACKING] SSE connection timeout, using polling');
          cleanupSSE();
          startPolling();
        }
      }, 3000);
    } catch (err) {
      console.error('[TRACKING] Failed to create EventSource:', err);
      startPolling();
    }

    // Cleanup function - CRITICAL for preventing memory leaks
    return () => {
      console.log('[TRACKING] Component unmounting, cleaning up connections');
      connectionStateRef.current.isCleaningUp = true;

      // Clear all timers
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (heartbeatTimer) clearInterval(heartbeatTimer);

      // Stop polling
      stopPolling();

      // Cleanup SSE
      cleanupSSE();
    };
  }, [waybillNumber]);

  useEffect(() => {
    let animationFrame: number;
    let frameCount = 0;

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

        // Only update state every 4 frames (~15fps) to reduce re-renders
        // This is sufficient for smooth visual updates while reducing CPU load
        frameCount++;
        if (frameCount % 4 === 0) {
          // Only update if position changed significantly (> 0.00001 degrees ~1 meter)
          const latDiff = Math.abs(lat - lastRenderPos.current[0]);
          const lngDiff = Math.abs(lng - lastRenderPos.current[1]);

          if (latDiff > 0.00001 || lngDiff > 0.00001) {
            setDisplayPos([lat, lng]);
            lastRenderPos.current = [lat, lng];
          }
        }

        if (t >= 1) {
          tweenFrom.current = [to[0], to[1]];
          tweenTo.current = null;
          // Ensure final position is rendered
          if (lastRenderPos.current[0] !== to[0] || lastRenderPos.current[1] !== to[1]) {
            setDisplayPos([to[0], to[1]]);
            lastRenderPos.current = [to[0], to[1]];
          }
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

    // Use ALL points to follow road geometry exactly - no sampling!
    // OSRM provides optimized geometry that follows roads precisely
    // Sampling would create straight lines and lose road detail
    console.log(`[MAP] Rendering route with ${pts.length} points for accurate road geometry`);
    return pts;
  }, [tracking?.routePoints]);

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
      {/* LIVE TRACKING INDICATOR */}
      {isLiveTracking && (
        <div className="absolute top-3 left-3 z-[1000] pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-full shadow-lg text-xs font-bold">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>LIVE</span>
          </div>
        </div>
      )}

      {/* HUD OVERLAY - Mobile Optimized */}
      <div
        className={`absolute ${isMobile ? 'top-3 right-3' : 'top-6 right-6'} z-[1000] flex justify-end items-start pointer-events-none`}
      >
        <div className="pointer-events-auto">
          <button
            onClick={() => setFollowMode(!followMode)}
            className={`flex items-center gap-2 ${isMobile ? 'px-4 py-3 text-[10px]' : 'px-6 py-4 text-xs'} rounded-3xl font-black uppercase tracking-widest transition-all shadow-2xl hover:scale-105 active:scale-95 touch-manipulation ${
              followMode ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
            aria-label={followMode ? 'Following vehicle' : 'Free view mode'}
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

        <AnimatedVehicleMarker position={displayPos} rotation={tracking.heading || 0} />
        <CircleMarker
          center={displayPos}
          radius={4}
          color="#2563eb"
          opacity={0.9}
          fillOpacity={1}
        />

        <MapController position={displayPos} followMode={followMode} />
      </MapContainer>
    </div>
  );
}
