/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
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
  Menu,
} from 'lucide-react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
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

/* ---------------------------------------------------------------------------
   Design system
   ---------------------------------------------------------------------------
   One spacing scale (4px base) drives every section, so the vertical rhythm and
   the gutters are identical page-wide:

     4 · 6 · 8 · 12 · 16 · 24   →   16 · 24 · 32 · 48 · 64 · 96 px

   Layout   : a single container + a single section rhythm
   Surfaces : rounded-xl, hairline navy border, soft elevation
   Controls : rounded-lg, two sizes only (sm, lg)
   Type     : one size per role (display / h2 / h3 / body / small / meta)
   --------------------------------------------------------------------------- */

const CONTAINER = 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8';
const SECTION = 'py-16 lg:py-24';
const SECTION_HEAD = 'mb-12 max-w-2xl lg:mb-16';

const EYEBROW = 'text-xs font-semibold uppercase tracking-[0.14em] text-navy-600';
const EYEBROW_ON_DARK = 'text-xs font-semibold uppercase tracking-[0.14em] text-accent';
const H1 =
  'mt-6 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl';
const H2 = 'text-2xl font-bold tracking-tight text-navy-900 md:text-3xl';
const H3 = 'text-lg font-semibold text-navy-900';
const LEAD = 'mt-4 text-base leading-relaxed text-charcoal-light';
const BODY = 'text-sm leading-relaxed text-charcoal-light';
const META = 'text-xs text-charcoal-muted';
const META_ON_DARK = 'text-xs text-navy-300';

const CARD = 'rounded-xl border border-navy-100 bg-white shadow-soft';
const GRID = 'grid gap-6';
const SPLIT = 'grid gap-12 lg:grid-cols-2 lg:gap-16';

const BTN =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors';
const BTN_PRIMARY = `${BTN} bg-accent text-navy-900 hover:bg-accent-dark`;
const BTN_LG = 'px-6 py-3 text-sm';
const BTN_SM = 'px-5 py-2.5 text-sm';
const BTN_ON_DARK = `${BTN} border border-navy-400/60 text-white hover:bg-navy-800`;

/** Arrow glyph used inside buttons — nudges on hover, never distracts. */
function ArrowIcon() {
  return (
    <ArrowRight
      aria-hidden="true"
      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
    />
  );
}

/**
 * Square icon tile. Its colour inversion and 5% scale on group hover is the
 * single, repeated icon animation across the page.
 */
function IconTile({
  icon: Glyph,
  tone = 'surface',
}: {
  icon: React.ComponentType<any>;
  tone?: 'surface' | 'accent';
}) {
  return (
    <span
      className={cn(
        'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-colors duration-300',
        tone === 'accent'
          ? 'bg-accent text-navy-900'
          : 'border border-navy-100 bg-navy-50 text-navy-700 group-hover:border-navy-900 group-hover:bg-navy-900 group-hover:text-accent'
      )}
    >
      <Glyph
        aria-hidden="true"
        className="h-6 w-6 transition-transform duration-300 group-hover:scale-105"
      />
    </span>
  );
}

const iconMap: Record<string, any> = { Truck, Ship, Plane, Package };

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

/** Shared advertisement artwork — identical layout for the single card and the carousel. */
function AdPanel({ ad }: { ad: any }) {
  return (
    <>
      {ad.imageUrl ? (
        <div className="relative h-56 bg-navy-100 md:h-72">
          <Image src={ad.imageUrl} alt={ad.title} fill className="object-cover" />
          <div className="absolute inset-0 bg-navy-950/70" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-10">
            <h2 className="mb-3 text-2xl font-bold tracking-tight md:text-3xl">{ad.title}</h2>
            {ad.description && (
              <p className="max-w-3xl text-sm leading-relaxed text-navy-100 md:text-base">
                {ad.description}
              </p>
            )}
            {ad.linkUrl && (
              <div className={cn(BTN_PRIMARY, BTN_SM, 'group mt-6')}>
                Learn More
                <ArrowIcon />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-navy-900 p-8 text-white md:p-12">
          <h2 className="mb-3 text-2xl font-bold tracking-tight md:text-3xl">{ad.title}</h2>
          {ad.description && <p className="mb-6 leading-relaxed text-navy-100">{ad.description}</p>}
          {ad.linkUrl && (
            <div className={cn(BTN_PRIMARY, BTN_SM, 'group')}>
              Learn More
              <ArrowIcon />
            </div>
          )}
        </div>
      )}
    </>
  );
}

function AdvertisementCard({ ad }: { ad: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={cn(
        'overflow-hidden transition-shadow duration-300 hover:shadow-soft-lg',
        CARD,
        ad.linkUrl ? 'cursor-pointer' : 'cursor-default'
      )}
      onClick={() => {
        if (ad.linkUrl) {
          window.open(ad.linkUrl, '_blank');
        }
      }}
    >
      <AdPanel ad={ad} />
    </motion.div>
  );
}

function AdvertisementCarousel({ advertisements }: { advertisements: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    // Autoplay pauses on hover/focus so it never competes with the reader.
    if (paused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % advertisements.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [advertisements.length, paused]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % advertisements.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + advertisements.length) % advertisements.length);
  };

  const arrowButton =
    'absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg bg-white text-navy-900 shadow-soft-lg transition-colors hover:bg-navy-50';

  return (
    <div
      role="region"
      aria-label="Featured announcements"
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="overflow-hidden rounded-xl">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {advertisements.map((ad) => (
            <div key={ad.id} className="min-w-full">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className={cn(
                  'overflow-hidden transition-shadow duration-300',
                  CARD,
                  ad.linkUrl ? 'cursor-pointer' : 'cursor-default'
                )}
                onClick={() => {
                  if (ad.linkUrl) {
                    window.open(ad.linkUrl, '_blank');
                  }
                }}
              >
                <AdPanel ad={ad} />
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        aria-label="Previous announcement"
        className={cn(arrowButton, 'left-4')}
      >
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        aria-label="Next announcement"
        className={cn(arrowButton, 'right-4')}
      >
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Indicator dots */}
      <div className="mt-6 flex justify-center gap-2">
        {advertisements.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to announcement ${index + 1}`}
            aria-current={index === currentIndex}
            className={cn(
              'h-2.5 rounded-full transition-all duration-300',
              index === currentIndex ? 'w-8 bg-navy-900' : 'w-2.5 bg-navy-200 hover:bg-navy-300'
            )}
          />
        ))}
      </div>
    </div>
  );
}

const ServicesGrid = React.memo(function ServicesGrid({
  services,
  iconMap,
}: {
  services: any[];
  iconMap: Record<string, any>;
}) {
  return (
    <div className={cn(GRID, 'sm:grid-cols-2 lg:grid-cols-4')}>
      {services.map((service, index) => {
        const IconComponent = iconMap[service.icon] || Truck;
        return (
          <motion.div
            key={service.id || index}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="group relative h-72 cursor-pointer overflow-hidden rounded-xl border border-navy-100 shadow-soft md:h-80"
          >
            <Image
              src={withVersion(service.imageUrl || '/logo.png', service.updatedAt)}
              alt={service.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority={index < 2}
            />
            <div className="absolute inset-0 bg-navy-950/75 transition-colors group-hover:bg-navy-950/85" />
            <div className="absolute bottom-0 left-0 p-6 text-white">
              <IconTile icon={IconComponent} tone="accent" />
              <h3 className={cn(H3, 'mb-2 mt-4 text-white')}>{service.title}</h3>
              <p className="text-sm leading-relaxed text-navy-100 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
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
    <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
      {executives.map((exec, index) => (
        <motion.div
          key={exec.id || index}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.15 }}
          className={cn(
            'group flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-soft-lg md:flex-row',
            CARD
          )}
        >
          <div className="relative h-64 w-full shrink-0 bg-navy-50 md:h-auto md:w-44">
            <Image
              src={exec.imageUrl || '/logo.png'}
              alt={exec.name}
              fill
              sizes="(max-width: 768px) 100vw, 176px"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center p-6">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-navy-600">
              {exec.role}
            </div>
            <h3 className="mb-3 text-xl font-semibold text-navy-900">{exec.name}</h3>
            <p className={BODY}>{exec.bio}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
});

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [executives, setExecutives] = useState<any[]>(initialExecutives);
  const [services, setServices] = useState<any[]>(initialServices);
  const [advertisements, setAdvertisements] = useState<any[]>(initialAdvertisements);

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

  // Chronological (oldest first) event history for the public tracking timeline
  const events: any[] = Array.isArray(searchResult?.events)
    ? [...searchResult.events].reverse()
    : [];

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
      const res = await fetch(`/api/shipments/${wb}`, {
        signal: controller.signal,
        cache: 'no-store',
      });
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
      console.error('Search error for', wb, ':', error);
      setError('Failed to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = waybill.trim();
    if (!term) return;
    performSearch(term);
  };

  const navLinks: [string, string][] = [
    ['#tracking', 'Track'],
    ['#services', 'Services'],
    ['#fleet', 'Freight'],
    ['#leadership', 'Leadership'],
  ];

  const socialLinks = [
    {
      href: 'https://www.instagram.com/kapilla.group_ltd/',
      label: 'Kapilla Group on Instagram',
      icon: <Instagram aria-hidden="true" className="h-5 w-5" />,
    },
    {
      href: 'https://facebook.com',
      label: 'Kapilla Group on Facebook',
      icon: <Facebook aria-hidden="true" className="h-5 w-5" />,
    },
    {
      href: 'https://x.com',
      label: 'Kapilla Group on X',
      icon: (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      href: 'https://tiktok.com',
      label: 'Kapilla Group on TikTok',
      icon: (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      ),
    },
  ];

  const serviceFeatures = [
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
  ];

  const heroPromises = [
    'Live waybill tracking, 24/7',
    'Road, sea and air freight',
    'Customs clearing and forwarding',
    'Pickup and delivery nationwide',
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-white font-sans text-charcoal">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:text-navy-900"
        >
          Skip to content
        </a>
        <Suspense fallback={null}>
          <SearchParamsHandler onSearch={performSearch} />
        </Suspense>

        {/* Navigation */}
        <header className="sticky top-0 z-50 border-b border-navy-800 bg-navy-900">
          <nav aria-label="Primary" className={CONTAINER}>
            <div className="flex h-16 items-center justify-between gap-4 md:h-20">
              <Link href="/" className="flex shrink-0 items-center gap-3">
                <span className="rounded-lg bg-white p-1.5">
                  <Image
                    src="/logo.png"
                    alt="Kapilla Group Ltd"
                    width={40}
                    height={40}
                    className="h-8 w-8 object-contain md:h-9 md:w-9"
                    priority
                  />
                </span>
                <span className="text-base font-semibold tracking-tight text-white md:text-lg">
                  Kapilla <span className="text-accent">Group</span>
                </span>
              </Link>

              <div className="hidden items-center gap-8 text-sm font-medium text-navy-100 lg:flex">
                {navLinks.map(([href, label]) => (
                  <a key={href} href={href} className="transition-colors hover:text-white">
                    {label}
                  </a>
                ))}
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                <div className="hidden items-center gap-1 text-navy-200 xl:flex">
                  {socialLinks.map((social) => (
                    <a
                      key={social.href}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="rounded-lg p-2 transition-colors hover:text-white"
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
                <button
                  onClick={() => setIsPickupModalOpen(true)}
                  className={cn(BTN_PRIMARY, BTN_SM, 'group p-2.5 md:px-5 md:py-2.5')}
                  aria-label="Request a pickup"
                >
                  <Truck aria-hidden="true" className="h-4 w-4" />
                  <span className="hidden md:inline">Request a Pickup</span>
                </button>
                <Link
                  href="/staff/login"
                  className={cn(BTN_ON_DARK, BTN_SM, 'hidden md:inline-flex')}
                  aria-label="Staff portal"
                >
                  Staff Portal
                </Link>
                <button
                  onClick={() => setIsMenuOpen((v) => !v)}
                  aria-label="Toggle navigation menu"
                  aria-expanded={isMenuOpen}
                  aria-controls="mobile-menu"
                  className="rounded-lg border border-navy-400/60 p-2.5 text-white transition-colors hover:bg-navy-800 lg:hidden"
                >
                  {isMenuOpen ? (
                    <X aria-hidden="true" className="h-5 w-5" />
                  ) : (
                    <Menu aria-hidden="true" className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {isMenuOpen && (
              <div id="mobile-menu" className="border-t border-navy-800 pb-6 lg:hidden">
                <div className="flex flex-col">
                  {navLinks.map(([href, label]) => (
                    <a
                      key={href}
                      href={href}
                      onClick={() => setIsMenuOpen(false)}
                      className="border-b border-navy-800 py-3.5 text-sm font-medium text-navy-100 transition-colors hover:text-white"
                    >
                      {label}
                    </a>
                  ))}
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsPickupModalOpen(true);
                    }}
                    className={cn(BTN_PRIMARY, BTN_SM, 'flex-1')}
                  >
                    Request a Pickup
                  </button>
                  <Link href="/staff/login" className={cn(BTN_ON_DARK, BTN_SM)}>
                    Staff Portal
                  </Link>
                </div>
              </div>
            )}
          </nav>
        </header>

        <main id="main">
          {/* Hero */}
          <section className={cn('relative overflow-hidden bg-navy-900', SECTION)}>
            <Image
              src="/background.jpg"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-navy-900/80" />

            <div className={cn(CONTAINER, 'relative')}>
              <div className={SPLIT}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="inline-flex items-center gap-2 rounded-lg border border-navy-700 bg-navy-800 px-3 py-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    <span className={EYEBROW_ON_DARK}>Transportation &amp; General Supply</span>
                  </div>
                  <h1 className={H1}>
                    Freight that moves on schedule, and stays visible end to end.
                  </h1>
                  <p className="mt-6 max-w-xl text-base leading-relaxed text-navy-100 lg:text-lg">
                    Kapilla Group transports cargo by road, sea and air across Tanzania, East Africa
                    and 200+ international destinations — with customs clearing, forwarding and
                    last-mile delivery handled by one accountable partner.
                  </p>

                  <div className="mt-8 flex flex-wrap gap-4">
                    <button
                      onClick={() => setIsPickupModalOpen(true)}
                      className={cn(BTN_PRIMARY, BTN_LG, 'group')}
                    >
                      Request a Pickup
                      <ArrowIcon />
                    </button>
                    <a href="#tracking" className={cn(BTN_ON_DARK, BTN_LG)}>
                      Track a Consignment
                    </a>
                  </div>

                  <ul className="mt-10 grid gap-x-8 gap-y-3 text-sm text-navy-100 sm:grid-cols-2">
                    {heroPromises.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle aria-hidden="true" className="h-4 w-4 shrink-0 text-accent" />
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
                  <div className={cn(CARD, 'p-6 shadow-soft-lg lg:p-8')}>
                    <h2 className="text-lg font-semibold text-navy-900">Track your consignment</h2>
                    <p className={cn(BODY, 'mt-2')}>
                      Enter the waybill number printed on your receipt to see the latest status and
                      location.
                    </p>
                    <form onSubmit={handleSearch} className="mt-6">
                      <label htmlFor="waybill" className="sr-only">
                        Waybill number
                      </label>
                      <div className="flex items-center gap-2 rounded-lg border border-navy-200 bg-white p-1.5 focus-within:border-navy-500">
                        <span className="pl-2 text-charcoal-muted" aria-hidden="true">
                          <Package className="h-5 w-5" />
                        </span>
                        <input
                          id="waybill"
                          type="text"
                          value={waybill}
                          onChange={(e) => setWaybill(e.target.value)}
                          placeholder="e.g. KPL-8829"
                          className="flex-1 bg-transparent py-2.5 text-base text-charcoal placeholder:text-charcoal-muted focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={loading}
                          className={cn(
                            BTN_PRIMARY,
                            'group px-4 py-2.5 disabled:cursor-not-allowed disabled:opacity-70'
                          )}
                        >
                          {loading ? (
                            <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
                          ) : (
                            <>
                              <span className="hidden sm:inline">Track</span>
                              <ArrowIcon />
                            </>
                          )}
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
                className={cn('bg-navy-50', SECTION)}
              >
                <div className={CONTAINER}>
                  <div className={cn(CARD, 'mx-auto max-w-4xl p-6 lg:p-8')} aria-live="polite">
                    {loading ? (
                      <div className="flex flex-col items-center py-10 text-center">
                        <Loader2
                          aria-hidden="true"
                          className="h-8 w-8 animate-spin text-navy-500"
                        />
                        <p className={cn(BODY, 'mt-4')}>
                          Looking up{' '}
                          <span className="font-semibold text-navy-900">{waybill.trim()}</span> …
                        </p>
                      </div>
                    ) : error ? (
                      <div className="py-4 text-center">
                        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-red-50">
                          <X aria-hidden="true" className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="font-semibold text-navy-900">Something went wrong</div>
                        <div className={cn(BODY, 'mt-2')}>{error}</div>
                        <button
                          onClick={() => performSearch(waybill)}
                          className={cn(BTN_PRIMARY, BTN_SM, 'mt-6')}
                        >
                          Try Again
                        </button>
                      </div>
                    ) : !searchResult ? (
                      <div className="py-4 text-center">
                        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-red-50">
                          <Package aria-hidden="true" className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="font-semibold text-navy-900">Shipment not found</div>
                        <div className={cn(BODY, 'mt-2')}>
                          We couldn't find any shipment with that waybill number. Please check the
                          number and try again.
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                          <div>
                            <div
                              className={cn(META, 'mb-2 font-semibold uppercase tracking-[0.14em]')}
                            >
                              Waybill number
                            </div>
                            <div className="font-mono text-xl font-bold tracking-tight text-navy-900 md:text-2xl">
                              {searchResult.waybillNumber}
                            </div>
                          </div>
                          <div className="flex flex-col md:items-end">
                            <div
                              className={cn(META, 'mb-2 font-semibold uppercase tracking-[0.14em]')}
                            >
                              Current status
                            </div>
                            <div
                              className={cn(
                                'rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-wide',
                                searchResult.currentStatus === 'DELIVERED'
                                  ? 'border-navy-200 bg-navy-100 text-navy-800'
                                  : searchResult.currentStatus === 'PENDING'
                                    ? 'border-navy-200 bg-navy-50 text-charcoal-light'
                                    : 'border-accent bg-accent-light text-navy-900'
                              )}
                            >
                              {(searchResult.currentStatus || 'UNKNOWN').replace(/_/g, ' ')}
                            </div>
                          </div>
                        </div>

                        {/* Consignment summary */}
                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                          <div className="rounded-lg border border-navy-100 p-4">
                            <div
                              className={cn(
                                META,
                                'mb-1.5 font-semibold uppercase tracking-[0.14em]'
                              )}
                            >
                              Route
                            </div>
                            <div className="text-sm font-semibold text-navy-900">
                              {searchResult.origin}
                              <span className="mx-1 text-charcoal-muted">→</span>
                              {searchResult.destination}
                            </div>
                          </div>
                          <div className="rounded-lg border border-navy-100 p-4">
                            <div
                              className={cn(
                                META,
                                'mb-1.5 font-semibold uppercase tracking-[0.14em]'
                              )}
                            >
                              Booked
                            </div>
                            <div className="text-sm font-semibold text-navy-900">
                              <FormattedDate dateStr={searchResult.createdAt} fallback="-" />
                            </div>
                          </div>
                          <div className="rounded-lg border border-navy-100 p-4">
                            <div
                              className={cn(
                                META,
                                'mb-1.5 font-semibold uppercase tracking-[0.14em]'
                              )}
                            >
                              Service
                            </div>
                            <div className="text-sm font-semibold text-navy-900">
                              {searchResult.serviceType || '—'}
                            </div>
                          </div>
                          <div className="rounded-lg border border-navy-100 p-4">
                            <div
                              className={cn(
                                META,
                                'mb-1.5 font-semibold uppercase tracking-[0.14em]'
                              )}
                            >
                              Cargo
                            </div>
                            <div className="text-sm font-semibold text-navy-900">
                              {[
                                searchResult.packageCount
                                  ? `${searchResult.packageCount} ${
                                      searchResult.packagingType || 'pkg'
                                    }`
                                  : null,
                                searchResult.weight ? `${searchResult.weight} kg` : null,
                              ]
                                .filter(Boolean)
                                .join(' · ') || '—'}
                            </div>
                          </div>
                        </div>

                        {/* Sender / recipient */}
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="rounded-lg border border-navy-100 p-4">
                            <div
                              className={cn(
                                META,
                                'mb-1.5 font-semibold uppercase tracking-[0.14em]'
                              )}
                            >
                              Sender
                            </div>
                            <div className="text-sm font-semibold text-navy-900">
                              {searchResult.senderName || '—'}
                            </div>
                            <div className={cn(META, 'mt-1')}>
                              {searchResult.senderAddress || searchResult.senderPhone || ''}
                            </div>
                          </div>
                          <div className="rounded-lg border border-navy-100 p-4">
                            <div
                              className={cn(
                                META,
                                'mb-1.5 font-semibold uppercase tracking-[0.14em]'
                              )}
                            >
                              Recipient
                            </div>
                            <div className="text-sm font-semibold text-navy-900">
                              {searchResult.receiverName || '—'}
                            </div>
                            <div className={cn(META, 'mt-1')}>
                              {searchResult.receiverAddress || searchResult.receiverPhone || ''}
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
                            <div className="rounded-lg border border-navy-100 bg-navy-50 p-10 text-center">
                              <Package
                                aria-hidden="true"
                                className="mx-auto mb-4 h-12 w-12 text-charcoal-muted"
                              />
                              <p className="font-medium text-charcoal">
                                Shipment is awaiting processing
                              </p>
                              <p className={cn(BODY, 'mt-2')}>
                                Tracking will be available as soon as the shipment is in transit.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Tracking history */}
                        {events.length > 0 && (
                          <div>
                            <h3
                              className={cn(META, 'mb-6 font-semibold uppercase tracking-[0.14em]')}
                            >
                              Tracking history
                            </h3>
                            <ol className="relative ml-3 space-y-8 border-l-2 border-navy-100">
                              {events.map((ev: any, i: number) => (
                                <li key={ev.id || i} className="relative pl-8">
                                  <span
                                    className={cn(
                                      'absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white',
                                      i === events.length - 1 ? 'bg-accent' : 'bg-navy-300'
                                    )}
                                  />
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <span className="text-sm font-semibold text-navy-900">
                                      {(ev.status || '').replace(/_/g, ' ')}
                                    </span>
                                    <span className={META}>
                                      <FormattedDate dateStr={ev.timestamp} fallback="-" />
                                    </span>
                                  </div>
                                  <div className={cn(BODY, 'mt-1')}>
                                    {ev.location}
                                    {ev.remarks ? ` — ${ev.remarks}` : ''}
                                  </div>
                                  {ev.staffName && (
                                    <div className={cn(META, 'mt-1')}>
                                      Handled by {ev.staffName}
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Advertisements Section */}
          {advertisements.length > 0 && (
            <section className={cn('bg-white', SECTION)}>
              <div className={CONTAINER}>
                {advertisements.length === 1 ? (
                  <AdvertisementCard ad={advertisements[0]} />
                ) : (
                  <AdvertisementCarousel advertisements={advertisements} />
                )}
              </div>
            </section>
          )}

          {/* Services & Fleet Showcase */}
          <section id="fleet" className={cn('bg-navy-50', SECTION)}>
            <div className={CONTAINER}>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className={SECTION_HEAD}
              >
                <span className={EYEBROW}>Fleet &amp; capabilities</span>
                <h2 className={cn(H2, 'mt-3')}>Freight solutions built around your supply chain</h2>
                <p className={LEAD}>
                  From a single parcel to full container loads, our land, sea and air capabilities
                  move cargo to schedule — with a documented handover at every stage.
                </p>
              </motion.div>

              <ServicesGrid services={services} iconMap={iconMap} />
            </div>
          </section>

          {/* Services & Features Grid */}
          <section id="services" className={cn('bg-white', SECTION)}>
            <div className={CONTAINER}>
              <div className={SECTION_HEAD}>
                <span className={EYEBROW}>What we do</span>
                <h2 className={cn(H2, 'mt-3')}>End-to-end logistics services</h2>
                <p className={LEAD}>
                  One partner for collection, freight, border clearance and final delivery — so you
                  deal with one team, one reference number and one point of accountability.
                </p>
              </div>

              <div className={cn(GRID, 'sm:grid-cols-2 lg:grid-cols-3')}>
                {serviceFeatures.map((feature, i) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
                    className={cn(
                      CARD,
                      'group p-6 transition-all duration-300 hover:border-navy-200 hover:shadow-soft-lg'
                    )}
                  >
                    <IconTile icon={feature.icon} />
                    <h3 className={cn(H3, 'mb-3 mt-6')}>{feature.title}</h3>
                    <p className={BODY}>{feature.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Executive Leadership */}
          <section id="leadership" className={cn('bg-navy-50', SECTION)}>
            <div className={CONTAINER}>
              <div className={SECTION_HEAD}>
                <span className={EYEBROW}>Our team</span>
                <h2 className={cn(H2, 'mt-3')}>Leadership</h2>
                <p className={LEAD}>
                  The team accountable for Kapilla Group's service standards, safety record and
                  day-to-day freight operations.
                </p>
              </div>

              <ExecSection executives={executives} />
            </div>
          </section>

          {/* Closing call to action */}
          <section className={cn('border-t border-navy-800 bg-navy-900', SECTION)}>
            <div className={CONTAINER}>
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                    Ready to move your cargo?
                  </h2>
                  <p className="mt-3 leading-relaxed text-navy-100">
                    Book a pickup and we will confirm collection, routing and documentation before
                    the consignment leaves your site.
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-4">
                  <button
                    onClick={() => setIsPickupModalOpen(true)}
                    className={cn(BTN_PRIMARY, BTN_LG, 'group')}
                  >
                    Request a Pickup
                    <ArrowIcon />
                  </button>
                  <a href="#tracking" className={cn(BTN_ON_DARK, BTN_LG)}>
                    Track a Consignment
                  </a>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className={cn('border-t border-navy-800 bg-navy-900 text-navy-200', SECTION)}>
          <div className={cn(CONTAINER, 'grid gap-12 md:grid-cols-4')}>
            <div className="md:col-span-2">
              <div className="mb-6 flex items-center gap-3">
                <span className="rounded-lg bg-white p-1.5">
                  <Image
                    src="/logo.png"
                    alt="Kapilla Group Ltd"
                    width={32}
                    height={32}
                    className="h-8 w-8 object-contain"
                  />
                </span>
                <span className="text-base font-semibold tracking-tight text-white">
                  Kapilla <span className="text-accent">Group</span>
                </span>
              </div>
              <p className="mb-6 max-w-sm leading-relaxed">
                Transportation and general supply for Tanzania and beyond. We move cargo on
                schedule, clear it through borders and deliver it with a documented handover.
              </p>
              <div className="mb-6 flex items-center gap-2 text-sm text-navy-200">
                <MapPin aria-hidden="true" className="h-4 w-4 text-accent" />
                Dar es Salaam, Tanzania
              </div>
              <div className={META_ON_DARK}>© 2026 Kapilla Group Ltd.</div>
              <div className="mt-4 text-xs font-mono font-bold tracking-wider text-navy-400">
                DEVELOPED BY KAISI
                <span className="mx-2">|</span>
                <a href="/staff/login" className="transition-colors hover:text-white">
                  STAFF LOGIN
                </a>
              </div>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold text-white">Company</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#services" className="transition-colors hover:text-white">
                    Services
                  </a>
                </li>
                <li>
                  <a href="#fleet" className="transition-colors hover:text-white">
                    Freight
                  </a>
                </li>
                <li>
                  <a href="#leadership" className="transition-colors hover:text-white">
                    Leadership
                  </a>
                </li>
                <li>
                  <Link href="/staff/login" className="transition-colors hover:text-white">
                    Staff Portal
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold text-white">Support</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <button
                    onClick={() => setIsHelpCenterOpen(true)}
                    className="text-left transition-colors hover:text-white"
                  >
                    Help Center
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setIsPickupModalOpen(true)}
                    className="text-left transition-colors hover:text-white"
                  >
                    Request a Pickup
                  </button>
                </li>
                <li>
                  <a href="#tracking" className="transition-colors hover:text-white">
                    Track a Consignment
                  </a>
                </li>
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
        <HelpCenterModal isOpen={isHelpCenterOpen} onClose={() => setIsHelpCenterOpen(false)} />
      </div>
    </MotionConfig>
  );
}
