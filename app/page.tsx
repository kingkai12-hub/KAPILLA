"use client";

import React, { useState, useEffect, Suspense, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Search, Package, ArrowRight, Truck, Globe, Clock, CheckCircle, MapPin, Loader2, Calendar, X, Plane, Ship, FileText, Zap, Facebook, Instagram, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Map from '@/components/Map';
import PickupRequestModal from '@/components/PickupRequestModal';
import ErrorBoundary from '@/components/ErrorBoundary';

import { locationCoords } from '@/lib/locations';

// Helper for classes
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
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

export default function Home() {
  const [waybill, setWaybill] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Clear staff session when visiting home page to ensure security
  useEffect(() => {
    localStorage.removeItem('kapilla_user');
  }, []);

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

  const mapProps = useMemo(() => {
    try {
      if (!searchResult) return null;

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
      
      // Determine the effective "current" location
      // If delivered, snap to destination
      const activeLocation = (isDelivered && destinationCoords)
          ? {
              lat: destinationCoords.lat,
              lng: destinationCoords.lng,
              label: searchResult.destination,
              timestamp: latestCheckIn?.timestamp || new Date().toISOString()
            }
          : (latestCheckIn && typeof latestCheckIn.latitude === 'number' && !isNaN(latestCheckIn.latitude) && typeof latestCheckIn.longitude === 'number' && !isNaN(latestCheckIn.longitude)) 
            ? {
                 lat: latestCheckIn.latitude,
                 lng: latestCheckIn.longitude,
                 label: latestCheckIn.location,
                 timestamp: new Date(latestCheckIn.timestamp).toLocaleString()
             } 
            : undefined;
         
      const startPoint = originCoords ? { ...originCoords, label: searchResult.origin } : undefined;
      const endPoint = destinationCoords ? { ...destinationCoords, label: searchResult.destination } : undefined;
      
      // Route Path logic
      let routePath: [number, number][] = [];
      if (originCoords && activeLocation) {
         routePath = [[originCoords.lat, originCoords.lng], [activeLocation.lat, activeLocation.lng]];
      }
      
      // Remaining Path logic
      let remainingPath: [number, number][] = [];
      // If NOT delivered, show remaining path
      if (!isDelivered) {
        const remainingStart = activeLocation ? { lat: activeLocation.lat, lng: activeLocation.lng } : (originCoords ? { lat: originCoords.lat, lng: originCoords.lng } : null);
        
        if (remainingStart && destinationCoords) {
           remainingPath = [[remainingStart.lat, remainingStart.lng], [destinationCoords.lat, destinationCoords.lng]];
        }
      }
      
      let center: [number, number] = [-6.3690, 34.8888];
      if (activeLocation) {
          center = [activeLocation.lat, activeLocation.lng];
      }
      
      const zoom = (checkIns.length > 0 || isDelivered) ? 10 : 6;
      
      return {
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
    } catch (error) {
      console.error("Error calculating map props:", error);
      return null;
    }
  }, [searchResult]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-white to-cyan-200 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Suspense fallback={null}>
        <SearchParamsHandler onSearch={performSearch} />
      </Suspense>
      {/* Navigation */}
      <nav className="absolute w-full z-10 px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-white p-1 rounded-lg shadow-sm">
              <Image src="/logo.png" alt="Kapilla Logo" width={40} height={40} className="w-8 h-8 md:w-10 md:h-10 object-contain" />
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
      <section className="relative pt-20 pb-8 lg:pt-28 lg:pb-16 overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-100/50 rounded-full blur-3xl -z-10 opacity-60 mix-blend-multiply filter pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-yellow-50/50 rounded-full blur-3xl -z-10 opacity-60 mix-blend-multiply filter pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 text-center">
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
            <p className="text-base text-slate-600 max-w-xl mx-auto mb-6">
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
        </div>
      </section>

      {/* Tracking Results */}
      <AnimatePresence>
        {hasSearched && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border-y border-slate-100 shadow-[inset_0_4px_20px_-12px_rgba(0,0,0,0.1)]"
          >
            <div className="max-w-4xl mx-auto px-6 py-10">
             <ErrorBoundary>
              {error ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mb-3">
                    <X className="w-7 h-7 text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Something went wrong</h3>
                  <p className="text-slate-500 mt-2 text-sm">{error}</p>
                  <button 
                    onClick={() => performSearch(waybill)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : !searchResult ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mb-3">
                    <Package className="w-7 h-7 text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Shipment Not Found</h3>
                  <p className="text-slate-500 mt-2 text-sm">
                    We couldn't find any shipment with that Waybill Number.
                  </p>
                </div>
              ) : (
                  <div className="space-y-8">
                    {/* Status Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                      <div>
                        <div className="text-xs text-slate-500 font-medium mb-1">Waybill Number</div>
                        <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{searchResult.waybillNumber}</div>
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

                    {/* Route Info */}
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
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Estimated Delivery</div>
                      <div className="font-semibold text-slate-900 text-base">
                        {latestEta ? <FormattedDate dateStr={latestEta} /> : 'Not available'}
                      </div>
                      </div>
                      <div className="space-y-1">
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Transport Type</div>
                      <div className="font-semibold text-slate-900 text-base">
                        {latestMode || 'Not available'}
                      </div>
                      </div>
                    </div>

                    {/* Map Section */}
                    <div className="w-full h-[250px] rounded-xl overflow-hidden shadow-sm border border-slate-100 relative z-0">
                         {mapProps && <Map {...mapProps} />}
                    </div>

                    {/* Download POD Button - Only if Delivered */}
                    {searchResult.currentStatus === 'DELIVERED' && (
                        <div className="mt-4 flex justify-center animate-in fade-in zoom-in duration-500">
                            <a 
                                href={`/staff/shipments/${searchResult.waybillNumber}/pod`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20 group"
                            >
                                <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                Download Proof of Delivery
                            </a>
                        </div>
                    )}

                    {/* Horizontal Status Line */}
                    <div className="w-full py-4 px-4">
                      <div className="flex items-center justify-between relative">
                        {/* Progress Bar Background */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 rounded-full -z-10" />
                        
                        {/* Active Progress Bar */}
                        <div 
                          className={cn(
                            "absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-full -z-10 transition-all duration-500",
                            searchResult.currentStatus === 'PENDING' ? "w-[0%]" :
                            searchResult.currentStatus === 'IN_TRANSIT' ? "w-[50%]" :
                            "w-[100%]"
                          )} 
                        />

                        {/* Steps */}
                        {[
                          { id: 'PENDING', label: 'Pending', icon: Package },
                          { id: 'IN_TRANSIT', label: 'In Transit', icon: Truck },
                          { id: 'DELIVERED', label: 'Delivered', icon: CheckCircle }
                        ].map((step, index) => {
                          const isCompleted = 
                            (step.id === 'PENDING' && ['PENDING', 'IN_TRANSIT', 'DELIVERED'].includes(searchResult.currentStatus)) ||
                            (step.id === 'IN_TRANSIT' && ['IN_TRANSIT', 'DELIVERED'].includes(searchResult.currentStatus)) ||
                            (step.id === 'DELIVERED' && searchResult.currentStatus === 'DELIVERED');

                          const isCurrent = step.id === searchResult.currentStatus;

                          return (
                            <div key={step.id} className="flex flex-col items-center gap-2 bg-white px-2">
                              <div className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                                isCompleted || isCurrent ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30" : "bg-white border-slate-300 text-slate-400"
                              )}>
                                <step.icon className="w-6 h-6" />
                              </div>
                              <span className={cn(
                                "text-sm font-bold transition-colors duration-300",
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
             </ErrorBoundary>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

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
            <div className="mt-4 text-[10px] font-mono text-slate-500 font-bold tracking-wider">DEVELOPED BY KAISI</div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Company</h4>
            <ul className="space-y-1.5 text-xs">
              <li><a href="#" className="hover:text-blue-400">About Us</a></li>
              <li><a href="#" className="hover:text-blue-400">Careers</a></li>
              <li><a href="#" className="hover:text-blue-400">Press</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Support</h4>
            <ul className="space-y-1.5 text-xs">
              <li><a href="#" className="hover:text-blue-400">Help Center</a></li>
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
    </div>
  );
}
