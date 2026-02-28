"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Metadata } from 'next';

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check authentication on mount and when navigating
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/session', {
          credentials: 'include',
          cache: 'no-store'
        });
        
        if (!res.ok) {
          // Not authenticated - redirect to login
          if (pathname !== '/staff/login') {
            window.location.href = '/staff/login';
          }
        }
      } catch (error) {
        // Network error or not authenticated
        if (pathname !== '/staff/login') {
          window.location.href = '/staff/login';
        }
      }
    };

    // Skip check for login page
    if (pathname !== '/staff/login') {
      checkAuth();
    }

    // Check auth on visibility change (when user comes back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && pathname !== '/staff/login') {
        checkAuth();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname, router]);

  return <>{children}</>;
}
