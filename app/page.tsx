"use client";

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Package, ArrowRight, Truck, Globe, Clock, CheckCircle, MapPin, Loader2, Calendar, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Map from '@/components/Map';
import PickupRequestModal from '@/components/PickupRequestModal';

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

export default function Home() {
  const [waybill, setWaybill] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);

  const performSearch = async (wb: string) => {
    setWaybill(wb);
    setLoading(true);
    setHasSearched(true);
    setSearchResult(null);

    try {
      const res = await fetch(`/api/shipments/${wb}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResult(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waybill.trim()) return;
    performSearch(waybill);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-white to-cyan-200 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Suspense fallback={null}>
        <SearchParamsHandler onSearch={performSearch} />
      </Suspense>
      {/* Navigation */}
      <nav className="absolute w-full z-10 px-6 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-white p-1 rounded-lg shadow-sm">
              <img src="/logo.png" alt="Kapilla Logo" className="w-14 h-14 object-contain" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">Kapilla<span className="text-blue-600">Group</span></span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
            <a href="#" className="hover:text-blue-600 transition-colors">Services</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Network</a>
            <a href="#" className="hover:text-blue-600 transition-colors">About</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Contact</a>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setIsPickupModalOpen(true)}
              className="px-5 py-2.5 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <Truck className="w-4 h-4" />
              Request Pickup
            </button>
            <a 
              href="/staff/login"
              className="px-5 py-2.5 rounded-full bg-white text-slate-900 text-sm font-semibold shadow-sm border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              Staff Portal
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-12 lg:pt-32 lg:pb-20 overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-100/50 rounded-full blur-3xl -z-10 opacity-60 mix-blend-multiply filter pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-yellow-50/50 rounded-full blur-3xl -z-10 opacity-60 mix-blend-multiply filter pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wide mb-4">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              Global Logistics Partner
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-4">
              Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">Trusted Partner</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
              Experience the next generation of logistics. Real-time tracking, global reach, and unmatched reliability for your business needs.
            </p>
          </motion.div>

          {/* Search Widget */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-xl mx-auto relative z-20"
          >
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative flex items-center bg-white rounded-xl shadow-xl p-2 pr-2.5">
                <div className="pl-4 pr-3 text-slate-400">
                  <Package className="w-6 h-6" />
                </div>
                <input
                  type="text"
                  value={waybill}
                  onChange={(e) => setWaybill(e.target.value)}
                  placeholder="Enter Waybill Number (e.g., KPL-8829)"
                  className="flex-1 py-4 bg-transparent text-lg font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-lg transition-all duration-200 shadow-md shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
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
            <div className="max-w-4xl mx-auto px-6 py-16">
              {!searchResult ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
                    <Package className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Shipment Not Found</h3>
                  <p className="text-slate-500 mt-2">
                    We couldn't find any shipment with that Waybill Number.
                  </p>
                </div>
              ) : (
                  <div className="space-y-12">
                    {/* Status Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-100">
                      <div>
                        <div className="text-sm text-slate-500 font-medium mb-1">Waybill Number</div>
                        <div className="text-3xl font-bold text-slate-900 font-mono tracking-tight">{searchResult.waybillNumber}</div>
                      </div>
                      <div className="flex flex-col md:items-end">
                        <div className="text-sm text-slate-500 font-medium mb-1">Current Status</div>
                        <div className={cn(
                          "px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide shadow-sm",
                          searchResult.currentStatus === 'DELIVERED' ? "bg-green-100 text-green-700" :
                          searchResult.currentStatus === 'PENDING' ? "bg-slate-100 text-slate-700" :
                          "bg-blue-100 text-blue-700"
                        )}>
                          {searchResult.currentStatus.replace(/_/g, ' ')}
                        </div>
                      </div>
                    </div>

                    {/* Route Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Origin</div>
                        <div className="font-semibold text-slate-900 text-lg">{searchResult.origin}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Destination</div>
                        <div className="font-semibold text-slate-900 text-lg">{searchResult.destination}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Estimated Delivery</div>
                        <div className="font-semibold text-slate-900 text-lg">Oct 24, 2026</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Service Type</div>
                        <div className="font-semibold text-slate-900 text-lg">Standard Ground</div>
                      </div>
                    </div>

                    {/* Map Section */}
                    <div className="w-full h-[320px] rounded-2xl overflow-hidden shadow-sm border border-slate-100 relative z-0">
                       <Map 
                         currentLocation={searchResult.trips?.[0]?.checkIns?.[0] ? {
                           lat: searchResult.trips[0].checkIns[0].latitude,
                           lng: searchResult.trips[0].checkIns[0].longitude,
                           label: searchResult.trips[0].checkIns[0].location,
                           timestamp: new Date(searchResult.trips[0].checkIns[0].timestamp).toLocaleString()
                         } : undefined}
                         startPoint={locationCoords[searchResult.origin] ? {
                           ...locationCoords[searchResult.origin],
                           label: searchResult.origin
                         } : undefined}
                         endPoint={locationCoords[searchResult.destination] ? {
                           ...locationCoords[searchResult.destination],
                           label: searchResult.destination
                         } : undefined}
                         routePath={
                           (() => {
                             const currentCheckIn = searchResult.trips?.[0]?.checkIns?.[0];
                             const originCoords = locationCoords[searchResult.origin];
                             
                             if (!originCoords) return [];

                             // Traveled Path: Origin -> Current Location (if exists)
                             if (currentCheckIn) {
                               return [
                                 [originCoords.lat, originCoords.lng],
                                 [currentCheckIn.latitude, currentCheckIn.longitude]
                               ];
                             }
                             
                             return [];
                           })()
                         }
                         remainingPath={
                           (() => {
                             const currentCheckIn = searchResult.trips?.[0]?.checkIns?.[0];
                             const originCoords = locationCoords[searchResult.origin];
                             const destinationCoords = locationCoords[searchResult.destination];
                             
                             if (!destinationCoords) return [];

                             // Remaining Path: Current Location (or Origin) -> Destination
                             const startPoint = currentCheckIn 
                               ? { lat: currentCheckIn.latitude, lng: currentCheckIn.longitude }
                               : (originCoords ? { lat: originCoords.lat, lng: originCoords.lng } : null);
                             
                             if (!startPoint) return [];

                             return [
                               [startPoint.lat, startPoint.lng],
                               [destinationCoords.lat, destinationCoords.lng]
                             ];
                           })()
                         }
                         center={searchResult.trips?.[0]?.checkIns?.[0] ? [
                           searchResult.trips[0].checkIns[0].latitude, 
                           searchResult.trips[0].checkIns[0].longitude
                         ] : [-6.3690, 34.8888]}
                         zoom={searchResult.trips?.[0]?.checkIns?.[0] ? 10 : 6}
                       />
                    </div>

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
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Features Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Kapilla Group?</h2>
            <p className="text-slate-600">We don't just move boxes; we deliver promises. Experience logistics re-imagined for the modern world.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Globe, title: 'Global Network', desc: 'Seamless shipping to over 200 countries with integrated customs handling.' },
              { icon: Clock, title: 'Real-Time Tracking', desc: 'Monitor your shipment 24/7 with GPS-enabled precision updates.' },
              { icon: Truck, title: 'Express Fleet', desc: 'From bikes to cargo planes, we have the right vehicle for every speed.' },
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-3xl bg-slate-50 hover:bg-white border border-slate-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 group">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <img src="/logo.png" alt="Kapilla Logo" className="w-10 h-10 object-contain brightness-0 invert" />
              <span className="text-lg font-bold text-white tracking-tight">Kapilla<span className="text-blue-500">Group</span></span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed mb-6">
              Setting the standard for modern logistics in East Africa and beyond. Fast, Secure, Reliable.
            </p>
            <div className="text-sm">© 2026 Kapilla Group Ltd.</div>
            <div className="mt-4 text-[10px] font-mono text-slate-500 font-bold tracking-wider">DEVELOPED BY KAISI</div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-blue-400">About Us</a></li>
              <li><a href="#" className="hover:text-blue-400">Careers</a></li>
              <li><a href="#" className="hover:text-blue-400">Press</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
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
