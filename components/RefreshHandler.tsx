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
            const currentCount = parseInt(sessionStorage.getItem('reload_count') || '0');
            const newCount = currentCount + 1;
            
            if (newCount >= 2) {
              sessionStorage.removeItem('reload_count');
              router.push('/');
            } else {
              sessionStorage.setItem('reload_count', newCount.toString());
            }
          } else if (navEntry.type === 'navigate') {
            sessionStorage.setItem('reload_count', '0');
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
