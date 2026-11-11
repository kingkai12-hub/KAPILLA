'use client';

import { useEffect } from 'react';

/**
 * Native (Capacitor / Android) integration glue.
 *
 * Capacitor does not wire the Android hardware back button to the WebView by
 * default — pressing it closes the app. Registering a listener makes back
 * behave like the browser: go back in history, and only exit at the root.
 * Registering the listener also disables Capacitor's default exit behaviour.
 *
 * No-ops when running in a normal browser.
 */
export default function CapacitorShell() {
  useEffect(() => {
    let removed = false;
    let listener: { remove: () => Promise<void> } | undefined;

    const register = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;

        const { App } = await import('@capacitor/app');
        listener = await App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            void App.exitApp();
          }
        });

        if (removed) {
          await listener.remove();
          listener = undefined;
        }
      } catch {
        // Not running inside the native shell — nothing to do.
      }
    };

    void register();

    return () => {
      removed = true;
      if (listener) void listener.remove();
    };
  }, []);

  return null;
}
