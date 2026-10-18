/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Package,
  ArrowRight,
  Truck,
  Globe,
  Clock,
  CheckCircle,
  MapPin,
  Loader2,
  X,
  Plane,
  Ship,
  FileText,
  Zap,
  Facebook,
  Instagram,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dynamic from 'next/dynamic';

const VehicleTrackingMap = dynamic(() => import('@/components/VehicleTrackingMap'), { ssr: false });
const DeliveryStatusView = dynamic(
  () =>
    import('@/components/DeliveryStatusView').then((mod) => ({ default: mod.DeliveryStatusView })),
  { ssr: false }
);
const MapErrorBoundary = dynamic(
  () => import('@/components/MapErrorBoundary').then((mod) => ({ default: mod.MapErrorBoundary })),
  { ssr: false }
);

// Dynamic imports for modals to prevent SSR issues
const PickupRequestModal = dynamic(() => import('@/components/PickupRequestModal'), { ssr: false });
const HelpCenterModal = dynamic(() => import('@/components/HelpCenterModal'), { ssr: false });

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
      typeof v === 'string'
        ? v
        : v instanceof Date
          ? v.toISOString()
          : typeof v === 'number'
            ? v
            : Date.now();
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
const FormattedDate = ({ dateStr, fallback = 'Just now' }: { dateStr: any; fallback?: string }) => {
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

function AdvertisementCard({ ad }: { ad: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={cn(
        'relative overflow-hidden rounded-lg border border-navy-100 shadow-soft transition-shadow duration-300 hover:shadow-soft-lg',
        ad.linkUrl ? 'cursor-pointer' : ''
      )}
      onClick={() => {
        if (ad.linkUrl) {
          window.open(ad.linkUrl, '_blank');
        }
      }}
    >
      {ad.imageUrl ? (
        <div className="relative h-56 md:h-72 bg-navy-100">
          <Image src={ad.imageUrl} alt={ad.title} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-navy-950/70" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">{ad.title}</h2>
            {ad.description && (
              <p className="text-sm md:text-base text-navy-100 max-w-3xl leading-relaxed">
                {ad.description}
              </p>
            )}
            {ad.linkUrl && (
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold bg-accent text-navy-900 px-5 py-2.5 rounded-md hover:bg-accent-dark transition-colors">
                Learn More
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 md:p-12 bg-navy-900 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">{ad.title}</h2>
          {ad.description && <p className="text-navy-100 mb-6 leading-relaxed">{ad.description}</p>}
          {ad.linkUrl && (
            <div className="inline-flex items-center gap-2 text-sm font-semibold bg-accent text-navy-900 px-5 py-2.5 rounded-md hover:bg-accent-dark transition-colors">
              Learn More
              <ArrowRight className="w-4 h-4" />
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function AdvertisementCarousel({ advertisements }: { advertisements: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % advertisements.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [advertisements.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % advertisements.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + advertisements.length) % advertisements.length);
  };

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-lg">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {advertisements.map((ad, index) => (
            <div key={ad.id} className="min-w-full">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className={cn(
                  'relative overflow-hidden rounded-lg border border-navy-100 shadow-soft transition-shadow duration-300',
                  ad.linkUrl ? 'cursor-pointer' : ''
                )}
                onClick={() => {
                  if (ad.linkUrl) {
                    window.open(ad.linkUrl, '_blank');
                  }
                }}
              >
                {ad.imageUrl ? (
                  <div className="relative h-56 md:h-72 bg-navy-100">
                    <Image src={ad.imageUrl} alt={ad.title} fill className="object-cover" />
                    <div className="absolute inset-0 bg-navy-950/70" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
                      <h2 className="text-2xl md:text-3xl font-bold mb-3">{ad.title}</h2>
                      {ad.description && (
                        <p className="text-sm md:text-base text-navy-100 max-w-3xl leading-relaxed">
                          {ad.description}
                        </p>
                      )}
                      {ad.linkUrl && (
                        <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold bg-accent text-navy-900 px-5 py-2.5 rounded-md hover:bg-accent-dark transition-colors">
                          Learn More
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 md:p-12 bg-navy-900 text-white">
                    <h2 className="text-2xl md:text-3xl font-bold mb-3">{ad.title}</h2>
                    {ad.description && (
                      <p className="text-navy-100 mb-6 leading-relaxed">{ad.description}</p>
                    )}
                    {ad.linkUrl && (
                      <div className="inline-flex items-center gap-2 text-sm font-semibold bg-accent text-navy-900 px-5 py-2.5 rounded-md hover:bg-accent-dark transition-colors">
                        Learn More
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        aria-label="Previous advertisement"
        className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white rounded-md shadow-soft-lg flex items-center justify-center text-navy-900 hover:bg-navy-50 transition-colors z-10"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        aria-label="Next advertisement"
        className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white rounded-md shadow-soft-lg flex items-center justify-center text-navy-900 hover:bg-navy-50 transition-colors z-10"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Indicator dots */}
      <div className="flex justify-center gap-2 mt-6">
        {advertisements.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to advertisement ${index + 1}`}
            className={cn(
              'h-2.5 rounded-full transition-all duration-300',
              index === currentIndex ? 'bg-navy-900 w-8' : 'bg-navy-200 hover:bg-navy-300 w-2.5'
            )}
          />
        ))}
      </div>
    </div>
  );
}

interface HomeClientProps {
  initialServices: any[];
  initialExecutives: any[];
  initialAdvertisements: any[];
}

export default function HomeClient({
  initialServices,
  initialExecutives,
  initialAdvertisements,
}: HomeClientProps) {
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
  const [advertisements, setAdvertisements] = useState<any[]>(initialAdvertisements);

  const iconMap: Record<string, any> = {
    Truck,
    Ship,
    Plane,
    Package,
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
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="group relative h-72 md:h-80 rounded-lg overflow-hidden cursor-pointer shadow-soft border border-navy-100"
            >
              <Image
                src={withVersion(service.imageUrl || '/logo.png', service.updatedAt)}
                alt={service.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority={index < 2}
              />
              <div className="absolute inset-0 bg-navy-950/75 group-hover:bg-navy-950/85 transition-colors" />
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <div className="bg-accent p-2 rounded-md w-fit mb-4">
                  <IconComponent className="w-5 h-5 text-navy-900" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{service.title}</h3>
                <p className="text-sm text-navy-100 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.15 }}
            className="bg-white rounded-lg overflow-hidden shadow-soft border border-navy-100 hover:shadow-soft-lg transition-shadow duration-300 flex flex-col md:flex-row"
          >
            <div className="relative w-full md:w-44 h-64 md:h-auto shrink-0 bg-navy-50">
              <Image
                src={exec.imageUrl || '/logo.png'}
                alt={exec.name}
                fill
                sizes="(max-width: 768px) 100vw, 176px"
                className="object-cover"
              />
            </div>
            <div className="p-6 flex flex-col justify-center">
              <div className="text-navy-600 font-semibold text-xs uppercase tracking-wider mb-2">
                {exec.role}
              </div>
              <h3 className="text-xl font-semibold text-navy-900 mb-3">{exec.name}</h3>
              <p className="text-charcoal-light text-sm leading-relaxed">{exec.bio}</p>
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
  } catch (e) {}

  const performSearch = async (wb: string) => {
    setWaybill(wb);
    setLoading(true);
    setHasSearched(true);
    setSearchResult(null);
    setError(null);

    try {
      console.log('🔍 Searching for waybill:', wb);
      // Abort any previous in-flight request
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(`/api/shipments/${wb}`, {
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);

      console.log('📡 API Response Status:', res.status);

      if (res.ok) {
        const data = await res.json();
        console.log('✅ Search successful:', {
          waybill: data.waybillNumber,
          status: data.currentStatus,
          origin: data.origin,
          destination: data.destination,
        });
        setSearchResult(data);
      } else {
        if (res.status === 404) {
          console.log('❌ Shipment not found:', wb);
          setSearchResult(null);
        } else {
          console.log('❌ Server error:', res.status);
          setError(`Server Error: ${res.status}`);
        }
      }
    } catch (error) {
      console.error('❌ Search error for', wb, ':', error);
      setError('Failed to connect to server. Please try again.');
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
    <div className="min-h-screen bg-white font-sans text-charcoal">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:text-navy-900"
      >
        Skip to content
      </a>
      <Suspense fallback={null}>
        <SearchParamsHandler onSearch={performSearch} />
      </Suspense>

      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-navy-900 border-b border-navy-800">
        <nav aria-label="Primary" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 md:h-20 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <span className="bg-white p-1.5 rounded-md">
                <Image
                  src="/logo.png"
                  alt="Kapilla Group Ltd"
                  width={40}
                  height={40}
                  className="w-8 h-8 md:w-9 md:h-9 object-contain"
                  priority
                />
              </span>
              <span className="text-base md:text-lg font-semibold text-white tracking-tight">
                Kapilla <span className="text-accent">Group</span>
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-navy-100">
              <a href="#tracking" className="hover:text-white transition-colors">
                Track
              </a>
              <a href="#services" className="hover:text-white transition-colors">
                Services
              </a>
              <a href="#fleet" className="hover:text-white transition-colors">
                Freight
              </a>
              <a href="#leadership" className="hover:text-white transition-colors">
                Leadership
              </a>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <div className="hidden xl:flex items-center gap-1 text-navy-200">
                <a
                  href="https://www.instagram.com/kapilla.group_ltd/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Kapilla Group on Instagram"
                  className="p-2 hover:text-white transition-colors rounded-md"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Kapilla Group on X"
                  className="p-2 hover:text-white transition-colors rounded-md"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Kapilla Group on Facebook"
                  className="p-2 hover:text-white transition-colors rounded-md"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Kapilla Group on TikTok"
                  className="p-2 hover:text-white transition-colors rounded-md"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                </a>
              </div>
              <button
                onClick={() => setIsPickupModalOpen(true)}
                className="p-2.5 md:px-5 md:py-2.5 rounded-md bg-accent text-navy-900 text-sm font-semibold hover:bg-accent-dark transition-colors flex items-center gap-2"
                aria-label="Request a pickup"
              >
                <Truck className="w-4 h-4" />
                <span className="hidden md:inline">Request a Pickup</span>
              </button>
              <Link
                href="/staff/login"
                className="p-2.5 md:px-5 md:py-2.5 rounded-md border border-navy-400/60 text-white text-sm font-semibold hover:bg-navy-800 transition-colors flex items-center gap-2"
                aria-label="Staff portal"
              >
                <User className="w-4 h-4 md:hidden" />
                <span className="hidden md:inline">Staff Portal</span>
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main id="main">
        {/* Hero */}
        <section className="relative bg-navy-900 overflow-hidden">
          <Image
            src="/background.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-navy-900/80" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-navy-800 border border-navy-700 text-navy-100 text-xs font-semibold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  Transportation &amp; General Supply
                </div>
                <h1 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
                  Freight that moves on schedule, and stays visible end to end.
                </h1>
                <p className="mt-6 text-base lg:text-lg text-navy-100 max-w-xl leading-relaxed">
                  Kapilla Group transports cargo by road, sea and air across Tanzania, East Africa
                  and 200+ international destinations — with customs clearing, forwarding and
                  last-mile delivery handled by one accountable partner.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <button
                    onClick={() => setIsPickupModalOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-accent text-navy-900 font-semibold hover:bg-accent-dark transition-colors"
                  >
                    Request a Pickup
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <a
                    href="#tracking"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-navy-400/60 text-white font-semibold hover:bg-navy-800 transition-colors"
                  >
                    Track a Consignment
                  </a>
                </div>

                <ul className="mt-10 grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm text-navy-100">
                  {[
                    'Live waybill tracking, 24/7',
                    'Road, sea and air freight',
                    'Customs clearing and forwarding',
                    'Pickup and delivery nationwide',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-accent shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Tracking card */}
              <motion.div
                id="tracking"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="w-full max-w-lg lg:ml-auto"
              >
                <div className="bg-white rounded-lg shadow-soft-lg p-6 lg:p-8">
                  <h2 className="text-lg font-semibold text-navy-900">Track your consignment</h2>
                  <p className="mt-2 text-sm text-charcoal-light">
                    Enter the waybill number printed on your receipt to see the latest status and
                    location.
                  </p>
                  <form onSubmit={handleSearch} className="mt-6">
                    <label htmlFor="waybill" className="sr-only">
                      Waybill number
                    </label>
                    <div className="flex items-center gap-2 rounded-md border border-navy-200 bg-white p-1.5 focus-within:border-navy-500">
                      <span className="pl-2 text-charcoal-muted" aria-hidden="true">
                        <Package className="w-5 h-5" />
                      </span>
                      <input
                        id="waybill"
                        type="text"
                        value={waybill}
                        onChange={(e) => setWaybill(e.target.value)}
                        placeholder="e.g. KPL-8829"
                        className="flex-1 py-2.5 bg-transparent text-base text-charcoal placeholder:text-charcoal-muted focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center gap-2 bg-accent text-navy-900 px-4 py-2.5 rounded-md font-semibold hover:bg-accent-dark transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <span className="hidden sm:inline">Track</span>
                        )}
                        {!loading && <ArrowRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Search results */}
        <AnimatePresence>
          {hasSearched && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-navy-50 py-12 lg:py-16"
            >
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white border border-navy-100 rounded-lg shadow-soft p-6 lg:p-8">
                  {error ? (
                    <div className="text-center py-4">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-red-50 mb-4">
                        <X className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="font-semibold text-navy-900">Something went wrong</div>
                      <div className="text-charcoal-light text-sm mt-2">{error}</div>
                      <button
                        onClick={() => performSearch(waybill)}
                        className="mt-6 px-5 py-2.5 bg-accent text-navy-900 rounded-md text-sm font-semibold hover:bg-accent-dark transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : !searchResult ? (
                    <div className="text-center py-4">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-red-50 mb-4">
                        <Package className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="font-semibold text-navy-900">Shipment not found</div>
                      <div className="text-charcoal-light text-sm mt-2">
                        We couldn't find any shipment with that waybill number. Please check the
                        number and try again.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="text-xs text-charcoal-muted font-semibold uppercase tracking-wider mb-2">
                            Waybill number
                          </div>
                          <div className="text-xl md:text-2xl font-bold text-navy-900 font-mono tracking-tight">
                            {searchResult.waybillNumber}
                          </div>
                        </div>
                        <div className="flex flex-col md:items-end">
                          <div className="text-xs text-charcoal-muted font-semibold uppercase tracking-wider mb-2">
                            Current status
                          </div>
                          <div
                            className={cn(
                              'px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide border',
                              searchResult.currentStatus === 'DELIVERED'
                                ? 'bg-navy-100 text-navy-800 border-navy-200'
                                : searchResult.currentStatus === 'PENDING'
                                  ? 'bg-navy-50 text-charcoal-light border-navy-200'
                                  : 'bg-accent-light text-navy-900 border-accent'
                            )}
                          >
                            {(searchResult.currentStatus || 'UNKNOWN').replace(/_/g, ' ')}
                          </div>
                        </div>
                      </div>

                      {/* Delivery Status View or Map */}
                      <div>
                        {searchResult.currentStatus === 'DELIVERED' ? (
                          <DeliveryStatusView
                            status={searchResult.currentStatus}
                            deliveredAt={searchResult.deliveredAt}
                            receivedBy={searchResult.receivedBy}
                            receiverSignature={searchResult.receiverSignature}
                            proofOfDelivery={searchResult.proofOfDelivery}
                            destination={searchResult.destination}
                            waybillNumber={searchResult.waybillNumber}
                          />
                        ) : searchResult.currentStatus === 'IN_TRANSIT' ? (
                          <MapErrorBoundary>
                            <VehicleTrackingMap waybillNumber={searchResult.waybillNumber} />
                          </MapErrorBoundary>
                        ) : (
                          <div className="bg-navy-50 rounded-md p-10 text-center border border-navy-100">
                            <Package className="w-12 h-12 text-charcoal-muted mx-auto mb-4" />
                            <p className="text-charcoal font-medium">
                              Shipment is awaiting processing
                            </p>
                            <p className="text-sm text-charcoal-light mt-2">
                              Tracking will be available as soon as the shipment is in transit.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Advertisements Section */}
        {advertisements.length > 0 && (
          <section className="py-16 lg:py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {advertisements.length === 1 ? (
                <AdvertisementCard ad={advertisements[0]} />
              ) : (
                <AdvertisementCarousel advertisements={advertisements} />
              )}
            </div>
          </section>
        )}

        {/* Services & Fleet Showcase */}
        <section id="fleet" className="py-16 lg:py-20 bg-navy-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl mb-12 lg:mb-16"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-navy-900 tracking-tight">
                Freight solutions built around your supply chain
              </h2>
              <p className="mt-4 text-charcoal-light leading-relaxed">
                From a single parcel to full container loads, our land, sea and air capabilities
                move cargo to schedule — with a documented handover at every stage.
              </p>
            </motion.div>

            <ServicesGrid services={services} iconMap={iconMap} />
          </div>
        </section>

        {/* Services & Features Grid */}
        <section id="services" className="py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12 lg:mb-16">
              <h2 className="text-2xl md:text-3xl font-bold text-navy-900 tracking-tight">
                End-to-end logistics services
              </h2>
              <p className="mt-4 text-charcoal-light leading-relaxed">
                One partner for collection, freight, border clearance and final delivery — so you
                deal with one team, one reference number and one point of accountability.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Package,
                  title: 'Express Courier',
                  desc: 'Time-critical documents and parcels collected, consolidated and delivered with proof of delivery.',
                },
                {
                  icon: Truck,
                  title: 'Freight Transportation',
                  desc: 'Road, rail, sea and air freight moved on planned schedules, with live status on every leg.',
                },
                {
                  icon: FileText,
                  title: 'Customs Clearing & Forwarding',
                  desc: 'Licensed brokerage that prepares documentation and duties so cargo keeps moving across borders.',
                },
                {
                  icon: Zap,
                  title: 'ADC Express',
                  desc: 'Priority handling for urgent consignments, using the fastest available transit window.',
                },
                {
                  icon: Clock,
                  title: 'Real-Time Tracking',
                  desc: 'Every consignment carries a waybill you can track from booking through to delivery, 24/7.',
                },
                {
                  icon: Globe,
                  title: 'Global Network',
                  desc: 'Connections into 200+ destinations let you ship internationally from a single point of contact.',
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
                  className="p-6 rounded-lg bg-white border border-navy-100 shadow-soft hover:shadow-soft-lg hover:border-navy-200 transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-navy-50 border border-navy-100 rounded-md flex items-center justify-center mb-6">
                    <feature.icon className="w-6 h-6 text-navy-700" />
                  </div>
                  <h3 className="text-lg font-semibold text-navy-900 mb-3">{feature.title}</h3>
                  <p className="text-charcoal-light leading-relaxed text-sm">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Executive Leadership */}
        <section id="leadership" className="py-16 lg:py-20 bg-navy-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12 lg:mb-16">
              <h2 className="text-2xl md:text-3xl font-bold text-navy-900 tracking-tight">
                Leadership
              </h2>
              <p className="mt-4 text-charcoal-light leading-relaxed">
                The team accountable for Kapilla Group's service standards, safety record and
                day-to-day freight operations.
              </p>
            </div>

            <ExecSection executives={executives} />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-navy-900 text-navy-200 py-16 border-t border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-white p-1.5 rounded-md">
                <Image
                  src="/logo.png"
                  alt="Kapilla Group Ltd"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
                />
              </span>
              <span className="text-base font-semibold text-white tracking-tight">
                Kapilla <span className="text-accent">Group</span>
              </span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed mb-6">
              Transportation and general supply for Tanzania and beyond. We move cargo on schedule,
              clear it through borders and deliver it with a documented handover.
            </p>
            <div className="flex items-center gap-2 text-sm text-navy-200 mb-6">
              <MapPin className="w-4 h-4 text-accent" />
              Dar es Salaam, Tanzania
            </div>
            <div className="text-xs text-navy-300">© 2026 Kapilla Group Ltd.</div>
            <div className="mt-4 text-[10px] font-mono text-navy-400 font-bold tracking-wider">
              DEVELOPED BY KAISI
              <span className="mx-2">|</span>
              <a href="/staff/login" className="hover:text-white transition-colors">
                STAFF LOGIN
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Company</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#services" className="hover:text-white transition-colors">
                  Services
                </a>
              </li>
              <li>
                <a href="#fleet" className="hover:text-white transition-colors">
                  Freight
                </a>
              </li>
              <li>
                <a href="#leadership" className="hover:text-white transition-colors">
                  Leadership
                </a>
              </li>
              <li>
                <Link href="/staff/login" className="hover:text-white transition-colors">
                  Staff Portal
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Support</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <button
                  onClick={() => setIsHelpCenterOpen(true)}
                  className="hover:text-white transition-colors text-left"
                >
                  Help Center
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsPickupModalOpen(true)}
                  className="hover:text-white transition-colors text-left"
                >
                  Request a Pickup
                </button>
              </li>
              <li>
                <a href="#tracking" className="hover:text-white transition-colors">
                  Track a Consignment
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>

      {/* Pickup Modal */}
      <PickupRequestModal isOpen={isPickupModalOpen} onClose={() => setIsPickupModalOpen(false)} />

      {/* Help Center Modal */}
      <HelpCenterModal isOpen={isHelpCenterOpen} onClose={() => setIsHelpCenterOpen(false)} />
    </div>
  );
}
