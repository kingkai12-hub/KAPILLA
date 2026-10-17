'use client';

import { useEffect } from 'react';

/**
 * Removes any previously installed service worker and clears Cache Storage.
 *
 * An earlier build registered a cache-first service worker that cached the `/`
 * HTML document forever under a cache name that never changed, so affected
 * browsers kept serving a stale page after every deploy. That surfaces as
 * "An error occurred in the Server Components render" because the stale
 * document no longer matches the current JS/RSC payload.
 *
 * This runs once on load and makes those browsers heal themselves.
 */
export default function ServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => registrations.forEach((r) => r.unregister()))
        .catch(() => {});
    }

    if ('caches' in window) {
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .catch(() => {});
    }
  }, []);

  return null;
}
