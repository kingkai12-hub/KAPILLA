"use client";

import React, { useState } from 'react';
import { Search, Package, ArrowRight, Truck, Globe, Clock, CheckCircle, MapPin, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Map from '@/components/Map';

// Helper for classes
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function Home() {
  const [waybill, setWaybill] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waybill) return;

    setLoading(true);
    setSearchResult(null);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/shipments/${waybill}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResult(data);
      } else {
        setSearchResult(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
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
            <a 
              href="/driver"
              className="px-5 py-2.5 rounded-full bg-slate-100 text-slate-900 text-sm font-semibold hover:bg-slate-200 transition-all"
            >
              Driver App
            </a>
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
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-100/50 rounded-full blur-3xl -z-10 opacity-60 mix-blend-multiply filter pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-yellow-50/50 rounded-full blur-3xl -z-10 opacity-60 mix-blend-multiply filter pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wide mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              Global Logistics Partner
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6">
              Delivery that <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">Moves You.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 mb-12 leading-relaxed">
              Fast, reliable, and secure logistics solutions tailored for your business. Track your shipment in real-time across our global network.
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
                  placeholder="Enter your Waybill Number (e.g., KPL-8829)"
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
                  <p className="text-slate-500 mt-2">We couldn't find any shipment with that Waybill Number.</p>
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
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

                  {/* Timeline */}
                  <div className="relative">
                    <div className="absolute top-0 left-8 h-full w-px bg-slate-200" />
                    <div className="space-y-8">
                      {searchResult.events.map((event: any, index: number) => (
                        <motion.div 
                          key={event.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative flex items-start group"
                        >
                          <div className={cn(
                            "absolute left-0 w-16 flex justify-center pt-1 bg-white",
                          )}>
                            <div className={cn(
                              "w-4 h-4 rounded-full border-2 z-10 transition-colors duration-300",
                              index === 0 ? "bg-blue-600 border-blue-600 ring-4 ring-blue-100" : "bg-white border-slate-300 group-hover:border-blue-400"
                            )} />
                          </div>
                          <div className="ml-16 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow w-full">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                              <span className="font-bold text-slate-900">{event.status.replace(/_/g, ' ')}</span>
                              <span className="text-sm text-slate-400 font-medium">
                                {new Date(event.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 text-sm mb-2">
                              <MapPin className="w-4 h-4 text-slate-400" />
                              {event.location}
                            </div>
                            {event.remarks && (
                              <p className="text-slate-500 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                                "{event.remarks}"
                              </p>
                            )}
                          </div>
                        </motion.div>
                      ))}
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
    </div>
  );
}
