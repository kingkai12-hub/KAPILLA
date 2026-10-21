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
  ArrowRight,
  CheckCircle,
  Clock,
  Facebook,
  FileText,
  Globe,
  Instagram,
  Loader2,
  MapPin,
  Menu,
  Package,
  Plane,
  Ship,
  Truck,
  X,
  Zap,
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
   Layout + type contracts
   ---------------------------------------------------------------------------
   Element dimensions are frozen at the pre-redesign baseline: every font size,
   line height, icon size, image box and spacing utility below is one that the
   original page already used. The refresh is carried by colour, surface,
   motion and structure instead — never by making anything larger.

     container   max-w-7xl · px-4 / sm:px-6 / lg:px-8
     section     py-16 / lg:py-20   (hero py-16 / lg:py-24)
     h1          text-3xl / sm:text-4xl / lg:text-5xl
     h2          text-2xl / md:text-3xl
     h3          text-lg   (text-xl in leadership)
     body        text-sm / text-base / lg:text-lg · text-xs meta
     icons       h-4 w-4 · h-5 w-5 · h-6 w-6 · tiles h-12 w-12 and p-2
     imagery     h-56 md:h-72 · h-72 md:h-80 · h-64 md:h-auto md:w-44
   --------------------------------------------------------------------------- */

const CONTAINER = 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8';
const CONTAINER_NARROW = 'mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8';
const SECTION_HEAD = 'max-w-2xl mb-12 lg:mb-16';

/* Type roles. Sizes and leading are unchanged; weight and colour carry rank. */
const EYEBROW = 'text-xs font-semibold uppercase tracking-wider text-navy-600';
const LABEL = 'text-xs font-semibold uppercase tracking-wider text-charcoal-muted';
const H1 =
  'mt-6 text-3xl font-bold tracking-tight text-white leading-tight sm:text-4xl lg:text-5xl';
const H2 = 'mt-4 text-2xl font-bold tracking-tight text-navy-900 md:text-3xl';
const H3 = 'text-lg font-semibold text-navy-900';
const LEAD = 'text-base text-navy-100 leading-relaxed lg:text-lg';
const SECTION_INTRO = 'mt-4 text-charcoal-light leading-relaxed text-pretty';
const BODY = 'text-sm text-charcoal-light leading-relaxed text-pretty';
const META = 'text-xs text-charcoal-muted';

/* Surfaces: one radius, one hairline, one elevation step per rank. */
const CARD = 'rounded-lg border border-navy-100 bg-white shadow-soft';
const CARD_LIFT =
  'transition-all duration-300 hover:-translate-y-1 hover:border-navy-200 hover:shadow-soft-lg';

/* Controls: a single radius and a single interaction model. */
const BTN =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 active:scale-95';
const BTN_PADDING_LG = 'px-6 py-3';
const BTN_PADDING_SM = 'px-5 py-2.5 text-sm';
const BTN_PADDING_INPUT = 'px-4 py-2.5';
const BTN_PRIMARY = `${BTN} bg-accent text-navy-900 shadow-soft hover:bg-accent-dark hover:shadow-soft-lg`;
const BTN_GHOST_DARK = `${BTN} border border-navy-400/60 text-white hover:bg-navy-800 focus-visible:outline-accent`;
const BTN_QUIET = `${BTN} border border-navy-200 bg-white text-navy-800 hover:border-navy-400 hover:bg-navy-50`;

const FOCUS_DARK = 'focus-visible:outline-accent';

/** Short rule + label: the marker that opens every section. */
function Eyebrow({ children, onDark = false }: { children: React.ReactNode; onDark?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', onDark ? 'text-accent' : '', EYEBROW)}>
      <span
        aria-hidden="true"
        className={cn('block w-4 border-t-2', onDark ? 'border-accent' : 'border-navy-500')}
      />
      {children}
    </span>
  );
}

/** Consistent opening for every section: marker, title, standfirst. */
function SectionHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={SECTION_HEAD}
    >
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className={H2}>{title}</h2>
      <p className={SECTION_INTRO}>{intro}</p>
    </motion.div>
  );
}

/** Arrow glyph used inside buttons — nudges on hover, never distracts. */
function ArrowIcon() {
  return (
    <ArrowRight
      aria-hidden="true"
      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
    />
  );
}

/** Icon tile for the service cards. Colour inverts on hover. */
function FeatureTile({ icon: Glyph }: { icon: React.ComponentType<any> }) {
  return (
    <span className="mb-6 flex w-12 h-12 items-center justify-center rounded-md border border-navy-100 bg-navy-50 transition-colors duration-300 group-hover:border-navy-900 group-hover:bg-navy-900">
      <Glyph
        aria-hidden="true"
        className="h-6 w-6 text-navy-700 transition-colors duration-300 group-hover:text-accent"
      />
    </span>
  );
}

/** Compact accent chip used on the photographic freight cards. */
function VehicleTile({ icon: Glyph }: { icon: React.ComponentType<any> }) {
  return (
    <span className="mb-4 flex w-fit rounded-md bg-accent p-2 shadow-soft">
      <Glyph aria-hidden="true" className="h-5 w-5 text-navy-900" />
    </span>
  );
}

const iconMap: Record<string, any> = { Truck, Ship, Plane, Package };

/**
 * A shipment that is still open long after booking is the one thing a client
 * needs to see first, so "needs attention" gets its own accent treatment.
 */
const STATUS_STYLES: Record<string, string> = {
  DELIVERED: 'border-navy-200 bg-navy-100 text-navy-800',
  PENDING: 'border-navy-200 bg-navy-50 text-charcoal-light',
};

function statusClass(status?: string) {
  return STATUS_STYLES[status ?? ''] ?? 'border-accent bg-accent-light text-navy-900';
}

/** Decorative backdrop shared by every dark band. */
function DarkBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0', className)}
      style={{
        backgroundImage:
          'radial-gradient(60% 120% at 12% 0%, rgba(46, 99, 168, 0.35), transparent 60%)',
      }}
    />
  );
}

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

const AD_SHELL =
  'group relative overflow-hidden rounded-lg border border-navy-100 shadow-soft transition-all duration-300 hover:shadow-soft-lg';

/**
 * One announcement. When it carries a destination it renders as a real anchor,
 * so it is reachable and actionable from the keyboard rather than being a
 * clickable box.
 */
function AdvertisementCard({ ad }: { ad: any }) {
  const inner = ad.imageUrl ? (
    <>
      <div className="relative h-56 md:h-72 bg-navy-100">
        <Image
          src={ad.imageUrl}
          alt={ad.title}
          fill
          sizes="100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          priority
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/70 to-navy-950/20"
      />
      <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 text-white">
        <Eyebrow onDark>Announcement</Eyebrow>
        <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">{ad.title}</h2>
        {ad.description && (
          <p className="mt-3 text-sm md:text-base text-navy-100 max-w-3xl leading-relaxed text-pretty">
            {ad.description}
          </p>
        )}
        {ad.linkUrl && (
          <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold bg-accent text-navy-900 px-5 py-2.5 rounded-lg shadow-soft transition-all duration-200 group-hover:bg-accent-dark">
            Learn More
            <ArrowIcon />
          </div>
        )}
      </div>
    </>
  ) : (
    <div className="relative isolate overflow-hidden p-8 md:p-12 bg-navy-900 text-white">
      <DarkBackdrop />
      <div className="relative">
        <Eyebrow onDark>Announcement</Eyebrow>
        <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">{ad.title}</h2>
        {ad.description && (
          <p className="mt-3 text-navy-100 max-w-3xl leading-relaxed text-pretty">
            {ad.description}
          </p>
        )}
        {ad.linkUrl && (
          <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold bg-accent text-navy-900 px-5 py-2.5 rounded-lg shadow-soft">
            Learn More
            <ArrowIcon />
          </div>
        )}
      </div>
    </div>
  );

  if (ad.linkUrl) {
    return (
      <motion.a
        href={ad.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className={cn(AD_SHELL, 'block', FOCUS_DARK)}
      >
        {inner}
      </motion.a>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={AD_SHELL}
    >
      {inner}
    </motion.div>
  );
}

function AdvertisementCarousel({ advertisements }: { advertisements: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || advertisements.length < 2) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % advertisements.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [advertisements.length, paused]);

  const goTo = (index: number) => setCurrentIndex(index);
  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % advertisements.length);
  const prevSlide = () =>
    setCurrentIndex((prev) => (prev - 1 + advertisements.length) % advertisements.length);

  const arrowClass =
    'absolute top-1/2 -translate-y-1/2 w-11 h-11 rounded-lg border border-navy-100 bg-white/95 shadow-soft-lg backdrop-blur flex items-center justify-center text-navy-900 transition-all duration-200 hover:bg-white active:scale-95 z-10';

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured announcements"
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') nextSlide();
        if (e.key === 'ArrowLeft') prevSlide();
      }}
    >
      <div className="overflow-hidden rounded-lg">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {advertisements.map((ad, index) => (
            <div
              key={ad.id}
              className="min-w-full"
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${advertisements.length}`}
              aria-hidden={index !== currentIndex}
            >
              <AdvertisementCard ad={ad} />
            </div>
          ))}
        </div>
      </div>

      {advertisements.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous announcement"
            className={cn(arrowClass, 'left-4', FOCUS_DARK)}
          >
            <svg
              aria-hidden="true"
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next announcement"
            className={cn(arrowClass, 'right-4', FOCUS_DARK)}
          >
            <svg
              aria-hidden="true"
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="flex justify-center gap-2 mt-6">
            {advertisements.map((_, index) => (
              <button
                type="button"
                key={index}
                onClick={() => goTo(index)}
                aria-label={`Go to announcement ${index + 1}`}
                aria-current={index === currentIndex}
                className={cn(
                  'h-2.5 rounded-full transition-all duration-300',
                  index === currentIndex ? 'bg-navy-900 w-8' : 'bg-navy-200 hover:bg-navy-400 w-2.5'
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface HomeClientProps {
  initialServices: any[];
  initialExecutives: any[];
  initialAdvertisements: any[];
}

const NAV_LINKS = [
  ['#tracking', 'Track'],
  ['#services', 'Services'],
  ['#fleet', 'Freight'],
  ['#leadership', 'Leadership'],
];

const MOBILE_NAV_LINKS = [
  ['#tracking', 'Track a consignment'],
  ['#services', 'Services'],
  ['#fleet', 'Freight'],
  ['#leadership', 'Leadership'],
];

const SOCIAL_LINKS = [
  {
    href: 'https://www.instagram.com/kapilla.group_ltd/',
    label: 'Kapilla Group on Instagram',
    icon: <Instagram aria-hidden="true" className="w-5 h-5" />,
  },
  {
    href: 'https://x.com',
    label: 'Kapilla Group on X',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    href: 'https://facebook.com',
    label: 'Kapilla Group on Facebook',
    icon: <Facebook aria-hidden="true" className="w-5 h-5" />,
  },
  {
    href: 'https://tiktok.com',
    label: 'Kapilla Group on TikTok',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    ),
  },
];

const SERVICE_PROMISES = [
  'Live waybill tracking, 24/7',
  'Road, sea and air freight',
  'Customs clearing and forwarding',
  'Pickup and delivery nationwide',
];

const SERVICE_FEATURES = [
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

export default function HomeClient({
  initialServices,
  initialExecutives,
  initialAdvertisements,
}: HomeClientProps) {
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
            <motion.article
              key={service.id || index}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (index % 4) * 0.08 }}
              className="group relative h-72 md:h-80 overflow-hidden rounded-lg border border-navy-100 shadow-soft transition-all duration-300 hover:shadow-soft-lg"
            >
              <Image
                src={withVersion(service.imageUrl || '/logo.png', service.updatedAt)}
                alt={service.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority={index < 2}
              />
              {/*
                The description used to be reveal-on-hover only, which hid it
                from keyboard and touch users. It is now always present, and the
                scrim is a gradient so the text keeps its contrast at any size.
              */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/85 to-navy-950/30 transition-colors duration-300 group-hover:via-navy-950/90"
              />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <VehicleTile icon={IconComponent} />
                <h3 className="text-lg font-semibold mb-2 tracking-tight">{service.title}</h3>
                <p className="text-sm text-navy-100 leading-relaxed text-pretty">
                  {service.description}
                </p>
              </div>
            </motion.article>
          );
        })}
      </div>
    );
  });

  const ExecSection = React.memo(function ExecSection({ executives }: { executives: any[] }) {
    // One card per leader in a single row on laptops and up, so every portrait
    // sits on the same line.
    return (
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
        {executives.map((exec, index) => (
          <motion.div
            key={exec.id || index}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.15 }}
            className={cn(
              'group flex flex-col overflow-hidden rounded-lg border border-navy-100 bg-white shadow-soft',
              CARD_LIFT
            )}
          >
            <div className="relative w-full h-64 shrink-0 bg-navy-50">
              <Image
                src={exec.imageUrl || '/logo.png'}
                alt={exec.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="p-6 flex flex-col">
              <div className="text-navy-600 font-semibold text-xs uppercase tracking-wider mb-2">
                {exec.role}
              </div>
              <h3 className="text-xl font-semibold text-navy-900 mb-3 tracking-tight">
                {exec.name}
              </h3>
              <p className="text-charcoal-light text-sm leading-relaxed text-pretty">{exec.bio}</p>
            </div>
          </motion.div>
        ))}
      </div>
    );
  });

  const abortRef = useRef<AbortController | null>(null);

  // Escape closes the mobile menu — expected keyboard behaviour for a disclosure.
  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMenuOpen]);

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
    const term = waybill.trim();
    if (!term) return;
    performSearch(term);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-white font-sans text-charcoal">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:text-navy-900"
        >
          Skip to content
        </a>
        <Suspense fallback={null}>
          <SearchParamsHandler onSearch={performSearch} />
        </Suspense>

        {/* Navigation */}
        <header className="sticky top-0 z-50 border-b border-navy-800 bg-navy-900/95 backdrop-blur supports-[backdrop-filter]:bg-navy-900/85">
          <nav aria-label="Primary" className={CONTAINER}>
            <div className="h-16 md:h-20 flex items-center justify-between gap-4">
              <Link
                href="/"
                className={cn('flex items-center gap-3 shrink-0 rounded-lg', FOCUS_DARK)}
              >
                <span className="bg-white p-1.5 rounded-md shadow-soft">
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
                {NAV_LINKS.map(([href, label]) => (
                  <a
                    key={href}
                    href={href}
                    className={cn('group relative transition-colors hover:text-white', FOCUS_DARK)}
                  >
                    {label}
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 border-b-2 border-accent origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                    />
                  </a>
                ))}
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                <div className="hidden xl:flex items-center gap-1 text-navy-200">
                  {SOCIAL_LINKS.map((social) => (
                    <a
                      key={social.href}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className={cn(
                        'p-2 rounded-lg transition-colors hover:text-accent',
                        FOCUS_DARK
                      )}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setIsPickupModalOpen(true)}
                  className={cn(BTN_PRIMARY, 'p-2.5 md:px-5 md:py-2.5 text-sm')}
                  aria-label="Request a pickup"
                >
                  <Truck aria-hidden="true" className="h-4 w-4" />
                  <span className="hidden md:inline">Request a Pickup</span>
                </button>
                <Link
                  href="/staff/login"
                  className={cn(BTN_GHOST_DARK, 'hidden md:flex px-5 py-2.5 text-sm')}
                  aria-label="Staff portal"
                >
                  <span>Staff Portal</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((v) => !v)}
                  aria-label="Toggle navigation menu"
                  aria-expanded={isMenuOpen}
                  aria-controls="mobile-menu"
                  className={cn(BTN_GHOST_DARK, 'lg:hidden p-2.5')}
                >
                  {isMenuOpen ? (
                    <X aria-hidden="true" className="h-5 w-5" />
                  ) : (
                    <Menu aria-hidden="true" className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  id="mobile-menu"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="lg:hidden border-t border-navy-800 pb-6 overflow-hidden"
                >
                  <div className="flex flex-col">
                    {MOBILE_NAV_LINKS.map(([href, label]) => (
                      <a
                        key={href}
                        href={href}
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                          'py-3.5 text-sm font-medium text-navy-100 border-b border-navy-800 transition-colors hover:text-accent',
                          FOCUS_DARK
                        )}
                      >
                        {label}
                      </a>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsPickupModalOpen(true);
                      }}
                      className={cn(BTN_PRIMARY, 'flex-1 px-4 py-3 text-sm')}
                    >
                      Request a Pickup
                    </button>
                    <Link href="/staff/login" className={cn(BTN_GHOST_DARK, 'px-4 py-3 text-sm')}>
                      Staff Portal
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </nav>
        </header>

        <main id="main">
          {/* Hero */}
          <section className="relative isolate bg-navy-950 overflow-hidden">
            <Image
              src="/background.jpg"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-30"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-950/90 to-navy-900/70"
            />
            <DarkBackdrop />

            <div className={cn(CONTAINER, 'relative py-16 lg:py-24')}>
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-navy-700 bg-white/5 text-navy-100 text-xs font-semibold uppercase tracking-wider backdrop-blur">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    Transportation &amp; General Supply
                  </div>
                  <h1 className={H1}>
                    Freight that moves on schedule, and stays visible end to end.
                  </h1>
                  <p className={cn(LEAD, 'mt-6 max-w-xl text-pretty')}>
                    Kapilla Group transports cargo by road, sea and air across Tanzania, East Africa
                    and 200+ international destinations — with customs clearing, forwarding and
                    last-mile delivery handled by one accountable partner.
                  </p>

                  <div className="mt-8 flex flex-wrap gap-4">
                    <button
                      type="button"
                      onClick={() => setIsPickupModalOpen(true)}
                      className={cn('group', BTN_PRIMARY, BTN_PADDING_LG)}
                    >
                      Request a Pickup
                      <ArrowIcon />
                    </button>
                    <a href="#tracking" className={cn(BTN_GHOST_DARK, BTN_PADDING_LG)}>
                      Track a Consignment
                    </a>
                  </div>

                  <ul className="mt-10 grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm text-navy-100">
                    {SERVICE_PROMISES.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle aria-hidden="true" className="w-4 h-4 text-accent shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Tracking card — the page's primary task, given the stronger surface */}
                <motion.div
                  id="tracking"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                  className="w-full max-w-lg lg:ml-auto scroll-mt-24"
                >
                  <div className="bg-white rounded-lg shadow-soft-lg p-6 lg:p-8 ring-1 ring-navy-900/5">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-navy-900">
                      <span aria-hidden="true" className="block w-4 border-t-2 border-accent" />
                      Track your consignment
                    </h2>
                    <p className="mt-2 text-sm text-charcoal-light text-pretty">
                      Enter the waybill number printed on your receipt to see the latest status and
                      location.
                    </p>
                    <form onSubmit={handleSearch} className="mt-6">
                      <label htmlFor="waybill" className="sr-only">
                        Waybill number
                      </label>
                      <div className="flex items-center gap-2 rounded-lg border border-navy-200 bg-navy-50 p-1.5 transition-colors focus-within:border-navy-500 focus-within:bg-white">
                        <span className="pl-2 text-charcoal-muted" aria-hidden="true">
                          <Package className="w-5 h-5" />
                        </span>
                        <input
                          id="waybill"
                          type="text"
                          value={waybill}
                          onChange={(e) => setWaybill(e.target.value)}
                          placeholder="e.g. KPL-8829"
                          autoComplete="off"
                          className="flex-1 py-2.5 bg-transparent text-base text-charcoal placeholder:text-charcoal-muted focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={loading}
                          aria-label="Track consignment"
                          className={cn(
                            BTN_PRIMARY,
                            BTN_PADDING_INPUT,
                            'disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-accent'
                          )}
                        >
                          {loading ? (
                            <Loader2 aria-hidden="true" className="w-5 h-5 animate-spin" />
                          ) : (
                            <span className="hidden sm:inline">Track</span>
                          )}
                          {!loading && <ArrowIcon />}
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
                className="bg-navy-50 py-12 lg:py-16 border-b border-navy-100"
              >
                <div className={CONTAINER_NARROW}>
                  <div
                    aria-live="polite"
                    className="bg-white border border-navy-100 rounded-lg shadow-soft p-6 lg:p-8"
                  >
                    {loading ? (
                      <div className="py-10 flex flex-col items-center text-center">
                        <Loader2
                          aria-hidden="true"
                          className="w-8 h-8 animate-spin text-navy-500"
                        />
                        <p className="mt-4 text-sm text-charcoal-light">
                          Looking up{' '}
                          <span className="font-semibold text-navy-900">{waybill.trim()}</span> …
                        </p>
                      </div>
                    ) : error ? (
                      <div className="text-center py-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-red-50 mb-4">
                          <X aria-hidden="true" className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="font-semibold text-navy-900">Something went wrong</div>
                        <div className="text-charcoal-light text-sm mt-2 text-pretty">{error}</div>
                        <button
                          type="button"
                          onClick={() => performSearch(waybill)}
                          className={cn(BTN_PRIMARY, 'mt-6 px-5 py-2.5 text-sm')}
                        >
                          Try Again
                        </button>
                      </div>
                    ) : !searchResult ? (
                      <div className="text-center py-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-navy-50 mb-4">
                          <Package aria-hidden="true" className="w-6 h-6 text-navy-500" />
                        </div>
                        <div className="font-semibold text-navy-900">Shipment not found</div>
                        <div className="text-charcoal-light text-sm mt-2 max-w-xl mx-auto text-pretty">
                          We couldn't find any shipment with that waybill number. Please check the
                          number and try again.
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className={LABEL + ' mb-2'}>Waybill number</div>
                            <div className="text-xl md:text-2xl font-bold text-navy-900 font-mono tracking-tight">
                              {searchResult.waybillNumber}
                            </div>
                          </div>
                          <div className="flex flex-col md:items-end">
                            <div className={LABEL + ' mb-2'}>Current status</div>
                            <div
                              className={cn(
                                'px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide border',
                                statusClass(searchResult.currentStatus)
                              )}
                            >
                              {(searchResult.currentStatus || 'UNKNOWN').replace(/_/g, ' ')}
                            </div>
                          </div>
                        </div>

                        {/* Consignment summary */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-navy-100 border border-navy-100 rounded-lg overflow-hidden">
                          <div className="bg-white p-4">
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-muted mb-1.5">
                              Route
                            </div>
                            <div className="text-sm font-semibold text-navy-900">
                              {searchResult.origin}
                              <span className="mx-1 text-charcoal-muted">→</span>
                              {searchResult.destination}
                            </div>
                          </div>
                          <div className="bg-white p-4">
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-muted mb-1.5">
                              Booked
                            </div>
                            <div className="text-sm font-semibold text-navy-900">
                              <FormattedDate dateStr={searchResult.createdAt} fallback="-" />
                            </div>
                          </div>
                          <div className="bg-white p-4">
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-muted mb-1.5">
                              Service
                            </div>
                            <div className="text-sm font-semibold text-navy-900">
                              {searchResult.serviceType || '—'}
                            </div>
                          </div>
                          <div className="bg-white p-4">
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-muted mb-1.5">
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
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="border border-navy-100 rounded-lg p-4 bg-navy-50/60">
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-muted mb-1.5">
                              Sender
                            </div>
                            <div className="text-sm font-semibold text-navy-900">
                              {searchResult.senderName || '—'}
                            </div>
                            <div className="text-xs text-charcoal-light mt-1">
                              {searchResult.senderAddress || searchResult.senderPhone || ''}
                            </div>
                          </div>
                          <div className="border border-navy-100 rounded-lg p-4 bg-navy-50/60">
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-muted mb-1.5">
                              Recipient
                            </div>
                            <div className="text-sm font-semibold text-navy-900">
                              {searchResult.receiverName || '—'}
                            </div>
                            <div className="text-xs text-charcoal-light mt-1">
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
                            <div className="bg-navy-50 rounded-lg p-10 text-center border border-navy-100">
                              <Package
                                aria-hidden="true"
                                className="w-12 h-12 text-charcoal-muted mx-auto mb-4"
                              />
                              <p className="text-charcoal font-medium">
                                Shipment is awaiting processing
                              </p>
                              <p className="text-sm text-charcoal-light mt-2 text-pretty">
                                Tracking will be available as soon as the shipment is in transit.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Tracking history */}
                        {events.length > 0 && (
                          <div>
                            <h3 className={LABEL + ' mb-6'}>Tracking history</h3>
                            <ol className="relative border-l-2 border-navy-100 ml-3 space-y-8">
                              {events.map((ev: any, i: number) => (
                                <li key={ev.id || i} className="relative pl-8">
                                  <span
                                    aria-hidden="true"
                                    className={cn(
                                      'absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white',
                                      i === events.length - 1 ? 'bg-accent' : 'bg-navy-300'
                                    )}
                                  />
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <span className="text-sm font-semibold text-navy-900">
                                      {(ev.status || '').replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-xs text-charcoal-muted">
                                      <FormattedDate dateStr={ev.timestamp} fallback="-" />
                                    </span>
                                  </div>
                                  <div className="text-sm text-charcoal-light mt-1 text-pretty">
                                    {ev.location}
                                    {ev.remarks ? ` — ${ev.remarks}` : ''}
                                  </div>
                                  {ev.staffName && (
                                    <div className="text-xs text-charcoal-muted mt-1">
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
            <section className="py-16 lg:py-20 bg-white">
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
          <section
            id="fleet"
            className="py-16 lg:py-20 bg-navy-50 scroll-mt-20 border-y border-navy-100"
          >
            <div className={CONTAINER}>
              <SectionHeader
                eyebrow="Our fleet"
                title="Freight solutions built around your supply chain"
                intro="From a single parcel to full container loads, our land, sea and air capabilities move cargo to schedule — with a documented handover at every stage."
              />

              <ServicesGrid services={services} iconMap={iconMap} />
            </div>
          </section>

          {/* Services & Features Grid */}
          <section id="services" className="py-16 lg:py-20 bg-white">
            <div className={CONTAINER}>
              <SectionHeader
                eyebrow="What we do"
                title="End-to-end logistics services"
                intro="One partner for collection, freight, border clearance and final delivery — so you deal with one team, one reference number and one point of accountability."
              />

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {SERVICE_FEATURES.map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
                    className={cn(
                      'group relative p-6 rounded-lg bg-white border border-navy-100 shadow-soft overflow-hidden',
                      CARD_LIFT
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 border-t-2 border-transparent transition-colors duration-300 group-hover:border-accent"
                    />
                    <FeatureTile icon={feature.icon} />
                    <h3 className={cn(H3, 'mb-3')}>{feature.title}</h3>
                    <p className={BODY}>{feature.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Executive Leadership */}
          <section
            id="leadership"
            className="py-16 lg:py-20 bg-navy-50 scroll-mt-20 border-y border-navy-100"
          >
            <div className={CONTAINER}>
              <SectionHeader
                eyebrow="Leadership"
                title="Leadership"
                intro="The team accountable for Kapilla Group's service standards, safety record and day-to-day freight operations."
              />

              <ExecSection executives={executives} />
            </div>
          </section>

          {/* Closing call to action */}
          <section className="relative isolate bg-navy-900 border-t border-navy-800 overflow-hidden">
            <DarkBackdrop />
            <div
              className={cn(
                CONTAINER,
                'relative py-14 lg:py-16 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8'
              )}
            >
              <div className="max-w-2xl">
                <Eyebrow onDark>Next step</Eyebrow>
                <h2 className="mt-4 text-2xl md:text-3xl font-bold text-white tracking-tight">
                  Ready to move your cargo?
                </h2>
                <p className="mt-3 text-navy-100 leading-relaxed text-pretty">
                  Book a pickup and we will confirm collection, routing and documentation before the
                  consignment leaves your site.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPickupModalOpen(true)}
                  className={cn('group', BTN_PRIMARY, BTN_PADDING_LG)}
                >
                  Request a Pickup
                  <ArrowIcon />
                </button>
                <a href="#tracking" className={cn(BTN_GHOST_DARK, BTN_PADDING_LG)}>
                  Track a Consignment
                </a>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="relative isolate bg-navy-900 text-navy-200 py-16 border-t border-navy-800">
          <div className={cn(CONTAINER, 'relative grid md:grid-cols-4 gap-12')}>
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
              <p className="max-w-sm text-sm leading-relaxed mb-6 text-pretty">
                Transportation and general supply for Tanzania and beyond. We move cargo on
                schedule, clear it through borders and deliver it with a documented handover.
              </p>
              <div className="flex items-center gap-2 text-sm text-navy-200 mb-6">
                <MapPin aria-hidden="true" className="w-4 h-4 text-accent" />
                Dar es Salaam, Tanzania
              </div>
              <div className="text-xs text-navy-300">© 2026 Kapilla Group Ltd.</div>
              <div className="mt-4 text-[10px] font-mono text-navy-400 font-bold tracking-wider">
                DEVELOPED BY KAISI
                <span className="mx-2">|</span>
                <a
                  href="/staff/login"
                  className={cn('transition-colors hover:text-white', FOCUS_DARK)}
                >
                  STAFF LOGIN
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm">Company</h3>
              <ul className="space-y-3 text-sm">
                {NAV_LINKS.filter(([href]) => href !== '#tracking').map(([href, label]) => (
                  <li key={href}>
                    <a
                      href={href}
                      className={cn('transition-colors hover:text-accent', FOCUS_DARK)}
                    >
                      {label}
                    </a>
                  </li>
                ))}
                <li>
                  <Link
                    href="/staff/login"
                    className={cn('transition-colors hover:text-accent', FOCUS_DARK)}
                  >
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
                    type="button"
                    onClick={() => setIsHelpCenterOpen(true)}
                    className={cn('text-left transition-colors hover:text-accent', FOCUS_DARK)}
                  >
                    Help Center
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsPickupModalOpen(true)}
                    className={cn('text-left transition-colors hover:text-accent', FOCUS_DARK)}
                  >
                    Request a Pickup
                  </button>
                </li>
                <li>
                  <a
                    href="#tracking"
                    className={cn('transition-colors hover:text-accent', FOCUS_DARK)}
                  >
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
