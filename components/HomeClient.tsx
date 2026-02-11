"use client";

import React, { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Package, ArrowRight, Truck, Globe, Clock, CheckCircle, MapPin, Loader2, Calendar, X, Plane, Ship, FileText, Zap, Facebook, Instagram, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import VehicleTrackingMapSimple from './VehicleTrackingMapSimple';
import PickupRequestModal from '@/components/PickupRequestModal';
import HelpCenterModal from '@/components/HelpCenterModal';
import ErrorBoundary from '@/components/ErrorBoundary';

import { locationCoords } from '@/lib/locations';

// Helper for classes
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

function withVersion(url: string, v?: any) {
  try {
    if (!url) return url;
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    const sep = url.includes('?') ? '&' : '?';
    const ver =
      typeof v === 'string' ? v :
      v instanceof Date ? v.toISOString() :
      (typeof v === 'number' ? v : Date.now());
    return `${url}${sep}v=${encodeURIComponent(ver)}`;
  } catch {
    return url;
  }
}

function SearchParamsHandler({ onSearch }: { onSearch: (term: string) => void }) {
  const searchParams = useSearchParams();
  const initialized = useRef(false);

  useEffect(() => {
    const wb = searchParams.get('waybill');
    if (wb && !initialized.current) {
      initialized.current = true;
      onSearch(wb);
    }
  }, [searchParams, onSearch]);

  return null;
}

// Safe date formatter helper with hydration protection
const FormattedDate = ({ dateStr, fallback = 'Just now' }: { dateStr: any, fallback?: string }) => {
  const [formatted, setFormatted] = useState<string | null>(null);

  useEffect(() => {
    if (!dateStr) {
      setFormatted(fallback);
      return;
    }
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        setFormatted(String(dateStr));
      } else {
        setFormatted(date.toLocaleString());
      }
    } catch (e) {
      setFormatted(String(dateStr));
    }
  }, [dateStr, fallback]);

  // Render a placeholder or the fallback initially to avoid mismatch, 
  // but for SEO/UX, it's better to match server output if possible.
  // Since we can't match server locale perfectly, we render nothing or a generic value until mount.
  if (formatted === null) return <span className="opacity-0">Loading...</span>; // Invisible placeholder to prevent layout shift
  
  return <span>{formatted}</span>;
};

interface HomeClientProps {
  initialServices: any[];
  initialExecutives: any[];
}

export default function HomeClient({ initialServices, initialExecutives }: HomeClientProps) {
  // Forced update trigger: 2026-01-31-12-30
  const [waybill, setWaybill] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [isHelpCenterOpen, setIsHelpCenterOpen] = useState(false);
  const [executives, setExecutives] = useState<any[]>(initialExecutives);
  const [services, setServices] = useState<any[]>(initialServices);

  const iconMap: Record<string, any> = {
    Truck,
    Ship,
    Plane,
    Package
  };

  const ServicesGrid = React.memo(function ServicesGrid({
    services,
    iconMap,
  }: {
    services: any[];
    iconMap: Record<string, any>;
  }) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map((service, index) => {
          const IconComponent = iconMap[service.icon] || Truck;
          return (
            <motion.div
              key={service.id || index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="group relative h-64 md:h-80 rounded-2xl overflow-hidden cursor-pointer shadow-lg"
            >
              <Image
                src={withVersion(service.imageUrl || '/logo.png', service.updatedAt)}
                alt={service.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                priority={index < 2}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
              <div className="absolute bottom-0 left-0 p-6 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <div className="bg-blue-600/90 p-2 rounded-lg w-fit mb-3 backdrop-blur-sm">
                  <IconComponent className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold mb-1">{service.title}</h3>
                <p className="text-sm text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                  {service.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  });

  const ExecSection = React.memo(function ExecSection({ executives }: { executives: any[] }) {
    return (
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {executives.map((exec, index) => (
          <motion.div
            key={exec.id || index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
            className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100 hover:shadow-xl transition-shadow duration-300 flex flex-col md:flex-row"
          >
            <div className="relative w-full md:w-48 h-64 md:h-64 shrink-0 bg-slate-100">
              <Image
                src={exec.imageUrl || '/logo.png'}
                alt={exec.name}
                fill
                sizes="(max-width: 768px) 100vw, 192px"
                className="object-cover"
              />
            </div>
            <div className="p-6 flex flex-col justify-center">
              <div className="text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
                {exec.role}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{exec.name}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {exec.bio}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    );
  });

  const abortRef = useRef<AbortController | null>(null);

  // Removed auto-clearing of staff session to prevent portal loading issues

  const latestEvent = searchResult?.events?.[0];
  let latestEta: string | null = null;
  let latestMode: string | null = null;

  try {
    if (latestEvent?.remarks && typeof latestEvent.remarks === 'string') {
      const etaMatch = latestEvent.remarks.match(/ETA:\s*([0-9-]+)(?:\s+([0-9:]+))?/i);
      const modeMatch = latestEvent.remarks.match(/Mode:\s*([A-Z]+)/i);

      if (etaMatch) {
        // Store raw date string for hydration-safe rendering
        const datePart = etaMatch[1];
        const timePart = etaMatch[2] ? ` ${etaMatch[2]}` : '';
        latestEta = datePart + timePart;
      }

      if (modeMatch) {
        const mode = modeMatch[1].toUpperCase();
        if (mode === 'AIR') latestMode = 'Air';
        else if (mode === 'WATER') latestMode = 'Water';
        else if (mode === 'LAND') latestMode = 'Land';
        else latestMode = mode;
      }
    }
  } catch (e) {
    console.error("Error parsing remarks:", e);
  }

  const performSearch = async (wb: string) => {
    setWaybill(wb);
    setLoading(true);
    setHasSearched(true);
    setSearchResult(null);
    setError(null);

    try {
      // Abort any previous in-flight request
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(`/api/shipments/${wb}`, { signal: controller.signal, cache: 'no-store' });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        setSearchResult(data);
      } else {
        if (res.status === 404) {
          setSearchResult(null);
        } else {
          setError(`Server Error: ${res.status}`);
        }
      }
    } catch (error) {
      console.error(error);
      setError("Failed to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waybill.trim()) return;
    performSearch(waybill);
  };

  // Enhanced route fetching with OSRM for realistic road-based routing
  const fetchRouteFromOSRM = async (start: [number, number], end: [number, number]): Promise<[number, number][]> => {
    try {
      // Ensure coordinates are valid numbers
      if (!start || !end || start.length !== 2 || end.length !== 2 ||
          isNaN(start[0]) || isNaN(start[1]) || isNaN(end[0]) || isNaN(end[1])) {
        console.warn('Invalid coordinates for routing, using straight line');
        return [start, end];
      }

      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&steps=false`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.warn('OSRM routing failed with status:', response.status, ', falling back to straight line');
        return [start, end];
      }

      const data = await response.json();

      if (data.routes && data.routes[0] && data.routes[0].geometry && data.routes[0].geometry.coordinates) {
        // Convert OSRM coordinates [lng, lat] to Leaflet [lat, lng] and ensure proper typing
        const routeCoordinates: [number, number][] = data.routes[0].geometry.coordinates.map((coord: [number, number]) => {
          if (Array.isArray(coord) && coord.length >= 2 && typeof coord[0] === 'number' && typeof coord[1] === 'number') {
            return [coord[1], coord[0]] as [number, number];
          }
          return [0, 0] as [number, number]; // fallback for invalid coordinates
        }).filter((coord: [number, number]) => coord[0] !== 0 || coord[1] !== 0); // remove fallback coordinates

        if (routeCoordinates.length >= 2) {
          console.log('OSRM routing successful, route has', routeCoordinates.length, 'points');
          return routeCoordinates;
        }
      }

      console.warn('OSRM returned invalid route data, falling back to straight line');
      return [start, end];
    } catch (error) {
      console.warn('OSRM routing error, falling back to straight line:', error);
      return [start, end];
    }
  };

  // Routing state
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [remainingPath, setRemainingPath] = useState<[number, number][]>([]);

  const mapProps = useMemo(() => {
    try {
      if (!searchResult) {
        console.log('No search result, returning null mapProps');
        return null;
      }

      const trip = searchResult.trips?.[0];
      const checkIns = trip?.checkIns ? [...trip.checkIns].filter((c: any) => c.latitude != null && c.longitude != null) : [];
      
      // Sort for latest check-in
      const sortedCheckIns = [...checkIns].sort((a: any, b: any) => {
        const tA = new Date(a.timestamp).getTime();
        const tB = new Date(b.timestamp).getTime();
        return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
      });
      
      const latestCheckIn = sortedCheckIns[0];
      const originCoords = locationCoords[searchResult.origin];
      const destinationCoords = locationCoords[searchResult.destination];
      const isDelivered = searchResult.currentStatus === 'DELIVERED';
      
      console.log('Map props calculation:', {
        origin: searchResult.origin,
        destination: searchResult.destination,
        isDelivered,
        hasOrigin: !!originCoords,
        hasDestination: !!destinationCoords,
        routePathLength: routePath.length,
        remainingPathLength: remainingPath.length
      });
      
      // Determine the effective "current" location
      // If delivered, snap to destination
      // If not delivered, don't pass currentLocation to allow free movement
      const activeLocation = (isDelivered && destinationCoords)
          ? {
              lat: destinationCoords.lat,
              lng: destinationCoords.lng,
              label: searchResult.destination,
              timestamp: latestCheckIn?.timestamp || new Date().toISOString()
            }
          : null; // Don't pass currentLocation when not delivered - let vehicle move freely
         
      const startPoint = originCoords ? { ...originCoords, label: searchResult.origin } : undefined;
      const endPoint = destinationCoords ? { ...destinationCoords, label: searchResult.destination } : undefined;

      let center: [number, number] = [-6.3690, 34.8888];
      if (activeLocation) {
          center = [activeLocation.lat, activeLocation.lng];
      } else if (originCoords) {
          // Use origin as center when no active location
          center = [originCoords.lat, originCoords.lng];
      } else if (destinationCoords) {
          // Use destination as fallback center
          center = [destinationCoords.lat, destinationCoords.lng];
      }

      const zoom = (checkIns.length > 0 || isDelivered) ? 10 : 6;

      const props = {
          currentLocation: activeLocation,
          startPoint,
          endPoint,
          routePath,
          remainingPath,
          center,
          zoom,
          checkIns: checkIns.map((c: any) => ({
               lat: c.latitude,
               lng: c.longitude,
               label: c.location || 'Check-in',
               timestamp: c.timestamp
          }))
      };

      console.log('Final map props:', props);
      return props;
    } catch (error) {
      console.error("Error calculating map props:", error);
      return null;
    }
  }, [searchResult, routePath, remainingPath]);

  // Load routes asynchronously when searchResult changes
  useEffect(() => {
    const loadRoutes = async () => {
      if (!searchResult) return;

      const trip = searchResult.trips?.[0];
      const checkIns = trip?.checkIns ? [...trip.checkIns].filter((c: any) => c.latitude != null && c.longitude != null) : [];

      const sortedCheckIns = [...checkIns].sort((a: any, b: any) => {
        const tA = new Date(a.timestamp).getTime();
        const tB = new Date(b.timestamp).getTime();
        return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
      });

      const latestCheckIn = sortedCheckIns[0];
      const originCoords = locationCoords[searchResult.origin];
      const destinationCoords = locationCoords[searchResult.destination];
      const isDelivered = searchResult.currentStatus === 'DELIVERED';

      const activeLocation = (isDelivered && destinationCoords)
          ? {
              lat: destinationCoords.lat,
              lng: destinationCoords.lng,
              label: searchResult.destination,
              timestamp: latestCheckIn?.timestamp || new Date().toISOString()
            }
          : null; // Don't use check-in location for route when not delivered - let vehicle move freely

      if (!originCoords || !destinationCoords) return;

      try {
        // Get full route from origin to destination for vehicle movement
        let traveledRoute: [number, number][] = [];
        let remainingRoute: [number, number][] = [];
        
        if (isDelivered && activeLocation) {
          // Delivered - show route to destination
          traveledRoute = await fetchRouteFromOSRM([originCoords.lat, originCoords.lng], [activeLocation.lat, activeLocation.lng]);
        } else if (!isDelivered) {
          // Not delivered - get full route for vehicle to travel along
          const fullRoute = await fetchRouteFromOSRM([originCoords.lat, originCoords.lng], [destinationCoords.lat, destinationCoords.lng]);
          
          // Split full route into traveled and remaining for display
          // Vehicle will move along the full route, but we show it as traveled/remaining
          traveledRoute = fullRoute; // Vehicle moves along full route
          remainingRoute = []; // No remaining path needed - vehicle moves along traveled route
        }

        setRoutePath(traveledRoute);
        setRemainingPath(remainingRoute);
      } catch (error) {
        console.error('Error loading routes:', error);
        // Fallback to straight lines
        let fallbackRoute: [number, number][] = [];
        let fallbackRemaining: [number, number][] = [];

        if (originCoords && destinationCoords) {
          if (isDelivered && activeLocation) {
            fallbackRoute = [[originCoords.lat, originCoords.lng], [activeLocation.lat, activeLocation.lng]];
          } else {
            // Full route for vehicle movement
            fallbackRoute = [[originCoords.lat, originCoords.lng], [destinationCoords.lat, destinationCoords.lng]];
            fallbackRemaining = [];
          }
        }

        setRoutePath(fallbackRoute);
        setRemainingPath(fallbackRemaining);
      }
    };

    loadRoutes();
  }, [searchResult]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-white to-cyan-200 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Suspense fallback={null}>
        <SearchParamsHandler onSearch={performSearch} />
      </Suspense>
      {/* Navigation */}
      <nav className="absolute w-full z-10 safe-nav">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-white p-1 rounded-lg shadow-sm">
              <Image src="/logo.png" alt="Kapilla Logo" width={40} height={40} className="w-8 h-8 md:w-10 md:h-10 object-contain" priority />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">Kapilla <span className="text-blue-600 hidden sm:inline">Group Ltd</span></span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-slate-500">
            <a href="https://www.instagram.com/kapilla.group_ltd/" target="_blank" rel="noopener noreferrer" className="hover:text-pink-600 transition-colors p-2 hover:bg-pink-50 rounded-full">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors p-2 hover:bg-slate-100 rounded-full">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-full">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors p-2 hover:bg-slate-100 rounded-full">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
              </svg>
            </a>
          </div>
          <div className="flex gap-2 md:gap-3">
            <button
              onClick={() => setIsPickupModalOpen(true)}
              className="cursor-pointer p-2 md:px-4 md:py-2 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
              aria-label="Request Pickup"
            >
              <Truck className="w-4 h-4 md:w-3.5 md:h-3.5" />
              <span className="hidden md:inline">Request Pickup</span>
            </button>
            <a 
              href="/staff/login"
              className="p-2 md:px-4 md:py-2 rounded-full bg-white text-slate-900 text-xs font-semibold shadow-sm border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2"
              aria-label="Staff Portal"
            >
              <User className="w-4 h-4 md:hidden" />
              <span className="hidden md:inline">Staff Portal</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-8 lg:pt-28 lg:pb-16 overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[520px] bg-blue-100/40 rounded-full blur-xl -z-10 opacity-60 mix-blend-normal pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[700px] h-[520px] bg-yellow-50/40 rounded-full blur-xl -z-10 opacity-50 mix-blend-normal pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-semibold uppercase tracking-wide mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              Global Logistics Partner
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">
              Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">Trusted Partner</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto mb-6">
              Experience the next generation of logistics. Real-time tracking, global reach, and unmatched reliability for your business needs.
            </p>
          </motion.div>

          {/* Search Widget */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-lg mx-auto relative z-20"
          >
            <div className="text-center mb-3">
              <span className="text-sm font-bold text-blue-900 uppercase tracking-wider">Track Your Cargo Here</span>
            </div>
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative flex items-center bg-white rounded-xl shadow-xl p-1.5 pr-2">
                <div className="pl-3 pr-2 text-slate-400">
                  <Package className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={waybill}
                  onChange={(e) => setWaybill(e.target.value)}
                  placeholder="Enter Waybill Number (e.g., KPL-8829)"
                  className="flex-1 py-3 bg-transparent text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg transition-all duration-200 shadow-md shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                </button>
              </div>
            </form>
          </motion.div>
          
          <AnimatePresence>
            {hasSearched && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="max-w-xl md:max-w-5xl mx-auto mt-4 md:mt-6 text-left"
              >
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
                  {error ? (
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-2">
                        <X className="w-6 h-6 text-red-500" />
                      </div>
                      <div className="font-bold text-slate-900">Something went wrong</div>
                      <div className="text-slate-500 text-sm mt-1">{error}</div>
                      <button 
                        onClick={() => performSearch(waybill)}
                        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : !searchResult ? (
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-2">
                        <Package className="w-6 h-6 text-red-500" />
                      </div>
                      <div className="font-bold text-slate-900">Shipment Not Found</div>
                      <div className="text-slate-500 text-sm mt-1">
                        We couldn't find any shipment with that Waybill Number.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="text-xs text-slate-500 font-medium mb-1">Waybill Number</div>
                          <div className="text-xl md:text-2xl font-bold text-slate-900 font-mono tracking-tight">{searchResult.waybillNumber}</div>
                        </div>
                        <div className="flex flex-col md:items-end">
                          <div className="text-xs text-slate-500 font-medium mb-1">Current Status</div>
                          <div className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm",
                            searchResult.currentStatus === 'DELIVERED' ? "bg-green-100 text-green-700" :
                            searchResult.currentStatus === 'PENDING' ? "bg-slate-100 text-slate-700" :
                            "bg-blue-100 text-blue-700"
                          )}>
                            {(searchResult.currentStatus || 'UNKNOWN').replace(/_/g, ' ')}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Origin</div>
                          <div className="font-semibold text-slate-900 text-base">{searchResult.origin}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Destination</div>
                          <div className="font-semibold text-slate-900 text-base">{searchResult.destination}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">ETA</div>
                          <div className="font-semibold text-slate-900 text-base">
                            {latestEta ? <FormattedDate dateStr={latestEta} /> : 'Not available'}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Mode</div>
                          <div className="font-semibold text-slate-900 text-base">{latestMode || 'N/A'}</div>
                        </div>
                      </div>
                      <div className="w-full h-48 md:h-72 rounded-xl overflow-hidden shadow-sm border border-slate-100 relative z-0">
                        {mapProps && <VehicleTrackingMapSimple key={`map-${searchResult?.waybillNumber}-${Date.now()}`} {...mapProps} />}
                      </div>
                      {searchResult.currentStatus === 'DELIVERED' && (
                        <div className="mt-2 flex justify-center">
                          <a 
                            href={`/staff/shipments/${searchResult.waybillNumber}/pod`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                          >
                            <CheckCircle className="w-5 h-5" />
                            Download Proof of Delivery
                          </a>
                        </div>
                      )}
                      <div className="w-full py-2 px-2">
                        <div className="flex items-center justify-between relative">
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 rounded-full -z-10" />
                          <div 
                            className={cn(
                              "absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-full -z-10 transition-all duration-500",
                              searchResult.currentStatus === 'PENDING' ? "w-[0%]" :
                              searchResult.currentStatus === 'IN_TRANSIT' ? "w-[50%]" :
                              "w-[100%]"
                            )} 
                          />
                          {[
                            { id: 'PENDING', label: 'Pending', icon: Package },
                            { id: 'IN_TRANSIT', label: 'In Transit', icon: Truck },
                            { id: 'DELIVERED', label: 'Delivered', icon: CheckCircle }
                          ].map((step) => {
                            const isCompleted = 
                              (step.id === 'PENDING' && ['PENDING', 'IN_TRANSIT', 'DELIVERED'].includes(searchResult.currentStatus)) ||
                              (step.id === 'IN_TRANSIT' && ['IN_TRANSIT', 'DELIVERED'].includes(searchResult.currentStatus)) ||
                              (step.id === 'DELIVERED' && searchResult.currentStatus === 'DELIVERED');
                            const isCurrent = step.id === searchResult.currentStatus;
                            return (
                              <div key={step.id} className="flex flex-col items-center gap-2 bg-white px-2">
                                <div className={cn(
                                  "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                                  isCompleted || isCurrent ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30" : "bg-white border-slate-300 text-slate-400"
                                )}>
                                  <step.icon className="w-5 h-5 md:w-6 md:h-6" />
                                </div>
                                <span className={cn(
                                  "text-[11px] md:text-sm font-bold transition-colors duration-300",
                                  isCompleted || isCurrent ? "text-slate-900" : "text-slate-400"
                                )}>
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Services & Fleet Showcase */}
      <section className="py-16 bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Global Logistics Infrastructure</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Our comprehensive network of land, sea, and air transportation ensures your cargo reaches its destination safely and on time.
            </p>
          </motion.div>

          <ServicesGrid services={services} iconMap={iconMap} />
        </div>
      </section>


      {/* Services & Features Grid */}
      <section className="py-8 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-50/50 skew-y-3 transform origin-bottom-left -z-10" />
        
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 tracking-tight">
              Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Global Services</span>
            </h2>
            <p className="text-slate-600 text-sm">
              In the line of our Global Network, Real Tracking, and ADC Express, we now offer a comprehensive suite of logistics solutions tailored to your needs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { 
                icon: Package, 
                title: 'Courier Services', 
                desc: 'Fast, reliable delivery for documents and parcels. Important items reach their destination safely and on time.' 
              },
              { 
                icon: Truck, 
                title: 'Transportation Services', 
                desc: 'Comprehensive multi-modal logistics solutions. Road, rail, air and sea freight to move your cargo efficiently.' 
              },
              { 
                icon: FileText, 
                title: 'Clearing & Forwarding', 
                desc: 'Expert customs brokerage and freight forwarding. We navigate complex regulations for smooth border crossings.' 
              },
              { 
                icon: Zap, 
                title: 'ADC Express', 
                desc: 'Premium express delivery service for your most urgent shipments. Lightning-fast transit times with priority handling.' 
              },
              { 
                icon: Clock, 
                title: 'Real-Time Tracking', 
                desc: 'Monitor your shipment 24/7 with GPS-enabled precision updates. Instant visibility into your cargo\'s location.' 
              },
              { 
                icon: Globe, 
                title: 'Global Network', 
                desc: 'Seamless shipping to over 200 countries. Leverage our integrated international network to expand worldwide.' 
              },
            ].map((feature, i) => (
              <div key={i} className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-blue-900/5 transition-all duration-300 group hover:-translate-y-1">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 text-blue-600">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed text-xs">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Executive Leadership */}
      <section className="py-16 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 tracking-tight">
              Executive <span className="text-blue-600">Leadership</span>
            </h2>
            <p className="text-slate-600 text-sm">
              Meet the visionaries driving Kapilla Group towards excellence and global standards.
            </p>
          </div>

          <ExecSection executives={executives} />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Image src="/logo.png" alt="Kapilla Logo" width={32} height={32} className="w-8 h-8 object-contain brightness-0 invert" />
              <span className="text-base font-bold text-white tracking-tight">Kapilla <span className="text-blue-500">Group Ltd</span></span>
            </div>
            <p className="max-w-xs text-xs leading-relaxed mb-4">
              Setting the standard for modern logistics in East Africa and beyond. Fast, Secure, Reliable.
            </p>
            <div className="text-xs">© 2026 Kapilla Group Ltd.</div>
            <div className="mt-4 text-[10px] font-mono text-slate-500 font-bold tracking-wider">
              DEVELOPED BY KAISI
              <span className="mx-2">|</span>
              <a href="/staff/login" className="hover:text-slate-300 transition-colors">STAFF LOGIN</a>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Company</h4>
            <ul className="space-y-1.5 text-xs">
              <li><a href="#" className="hover:text-blue-400">About Us</a></li>
              <li><a href="#" className="hover:text-blue-400">Careers</a></li>
              <li><a href="#" className="hover:text-blue-400">Press</a></li>
              <li><Link href="/staff/login" className="hover:text-blue-400">Staff Portal</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Support</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button 
                  onClick={() => setIsHelpCenterOpen(true)} 
                  className="hover:text-blue-400 text-left"
                >
                  Help Center
                </button>
              </li>
              <li><a href="#" className="hover:text-blue-400">Terms of Service</a></li>
              <li><a href="#" className="hover:text-blue-400">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
      </footer>
      {/* Pickup Modal */}
      <PickupRequestModal 
        isOpen={isPickupModalOpen} 
        onClose={() => setIsPickupModalOpen(false)} 
      />
      
      {/* Help Center Modal */}
      <HelpCenterModal 
        isOpen={isHelpCenterOpen} 
        onClose={() => setIsHelpCenterOpen(false)} 
      />
    </div>
  );
}
