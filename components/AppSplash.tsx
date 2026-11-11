'use client';

import { useEffect, useState } from 'react';
import BrandSplash from '@/components/BrandSplash';

/**
 * Minimum splash duration for the native Android shell, in milliseconds.
 *
 * A cold start otherwise blinks: the native launch drawable hands over to the
 * WebView and the home screen appears before the launch reads as a deliberate
 * app opening. Holding the splash for a fixed minimum makes the whole start
 * feel intentional.
 */
const MIN_SPLASH_MS = 5000;

/** Must match the opacity transition duration below. */
const FADE_MS = 420;

/**
 * Native-only splash gate.
 *
 * Mounted once in the root layout, so it runs on a full document load (a cold
 * app start) and never on in-app client-side navigation.
 *
 * Inside the Capacitor shell the splash is held for at least MIN_SPLASH_MS,
 * measured from page start so time already spent on the native launch drawable
 * counts towards the total. In a plain browser it is dismissed as soon as
 * hydration completes, so the public website is not slowed down.
 */
export default function AppSplash() {
  const [phase, setPhase] = useState<'visible' | 'fading' | 'gone'>('visible');

  /**
   * Lock page scroll only while the splash actually covers the screen.
   *
   * Keyed on `phase` so the lock is released the moment it becomes 'gone'.
   * AppSplash is mounted once in the root layout and never unmounts, so an
   * unmount-only cleanup would leave `body { overflow: hidden }` applied to the
   * whole session and make every page unscrollable.
   */
  useEffect(() => {
    if (phase === 'gone') return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [phase]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const fadeOut = () => {
      if (cancelled) return;
      setPhase('fading');
      timer = setTimeout(() => {
        if (!cancelled) setPhase('gone');
      }, FADE_MS);
    };

    const start = async () => {
      let isNative = false;
      try {
        const { Capacitor } = await import('@capacitor/core');
        isNative = Capacitor.isNativePlatform();
      } catch {
        isNative = false;
      }

      if (cancelled) return;

      if (!isNative) {
        fadeOut();
        return;
      }

      // Measured from navigation start, not from mount: the native launch
      // drawable is the same artwork, so its time on screen counts too.
      const remaining = Math.max(0, MIN_SPLASH_MS - performance.now());
      timer = setTimeout(fadeOut, remaining);
    };

    void start();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (phase === 'gone') return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] transition-opacity ease-out ${
        phase === 'fading' ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <BrandSplash className="h-full w-full" />
    </div>
  );
}
