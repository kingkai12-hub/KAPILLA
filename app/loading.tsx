import BrandSplash from '@/components/BrandSplash';

/**
 * Route-level loading screen — the "opening the app" state.
 *
 * The root layout is force-dynamic and every page awaits database work, so on a
 * cold open the browser can sit on an empty document for a moment. This fallback
 * streams immediately and gives the app a branded, native-feeling splash instead
 * of a white flash.
 *
 * The same surface is reused by the native cold-start gate in
 * components/AppSplash.tsx, which additionally holds it for a minimum duration.
 */
export default function Loading() {
  return <BrandSplash className="min-h-screen" />;
}
