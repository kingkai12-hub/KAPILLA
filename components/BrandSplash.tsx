import Image from 'next/image';

/**
 * The branded "opening the app" surface.
 *
 * Shared by the route-level fallback (app/loading.tsx) and the native cold-start
 * gate (components/AppSplash.tsx) so both paint the exact same screen and a cold
 * start never flickers between two different loading designs.
 *
 * Positioning is left to the caller through `className`; the gradient sheet, the
 * glowing mark and the sweep bar are fixed here. All motion is neutralised by the
 * global prefers-reduced-motion rule in globals.css.
 */
export default function BrandSplash({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-12 overflow-hidden bg-gradient-to-b from-white via-white to-navy-100 px-6 text-center ${className}`}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      aria-busy="true"
    >
      {/* Brand glow + bottom fade, so the white gradient has depth */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-navy-100 to-transparent" />
      </div>

      <div className="relative flex h-56 w-56 items-center justify-center sm:h-72 sm:w-72">
        {/* Expanding halo — offset rings so the pulse never stalls */}
        <span
          aria-hidden="true"
          className="logo-ring absolute inset-0 rounded-full border-2 border-navy-300/60"
        />
        <span
          aria-hidden="true"
          className="logo-ring absolute inset-0 rounded-full border-2 border-accent/50"
          style={{ animationDelay: '1.3s' }}
        />
        <span className="logo-breathe relative block">
          <Image
            src="/logo.png"
            alt="Kapilla Group Ltd"
            width={320}
            height={320}
            priority
            className="h-44 w-44 object-contain drop-shadow-[0_14px_36px_rgba(11,31,58,0.2)] sm:h-56 sm:w-56"
          />
        </span>
      </div>

      <div role="status" aria-live="polite" className="relative flex flex-col items-center gap-3">
        <span className="relative block h-1.5 w-48 overflow-hidden rounded-full bg-navy-100">
          <span className="loading-sweep absolute inset-y-0 left-0 w-1/2 rounded-full bg-accent" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-navy-600">
          Loading
        </span>
      </div>
    </div>
  );
}
