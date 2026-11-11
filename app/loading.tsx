import Image from 'next/image';
import { Loader2 } from 'lucide-react';

/**
 * Route-level loading screen — the "opening the app" state.
 *
 * The root layout is force-dynamic and every page awaits database work, so on a
 * cold open the browser can sit on an empty document for a moment. This fallback
 * streams immediately and gives the app a branded, native-feeling splash instead
 * of a white flash.
 *
 * Light surface on purpose: the Kapilla mark is a blue/black transparent PNG and
 * would disappear against the dark navy.
 */
export default function Loading() {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-5">
        <span className="rounded-2xl bg-white p-4 shadow-soft-lg">
          <Image
            src="/logo.png"
            alt="Kapilla Group Ltd"
            width={112}
            height={112}
            priority
            className="h-20 w-20 object-contain sm:h-24 sm:w-24"
          />
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-navy-600">
          Kapilla Group
        </p>
      </div>

      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 text-sm font-medium text-charcoal-muted"
      >
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin text-navy-500" />
        Loading…
      </div>
    </div>
  );
}
