"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RefreshHandler() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkRefresh = () => {
      try {
        const entries = performance.getEntriesByType("navigation");
        if (entries.length > 0) {
          const navEntry = entries[0] as PerformanceNavigationTiming;
          
          if (navEntry.type === 'reload') {
            // Disabled aggressive redirect on reload to prevent confusion during debugging
            console.log('Page reloaded');
          }
        }
      } catch (e) {
        console.error("Error handling refresh logic:", e);
      }
    };

    checkRefresh();
  }, [router]);

  return null;
}
