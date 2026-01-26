"use client";

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export default function IdleLogout() {
  const router = useRouter();
  const pathname = usePathname();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only activate if user is logged in OR if we want to enforce home redirect for everyone.
    // User specifically mentioned "AVOID OTHER PEOPLE TO USE SOMEONE ACCOUNT".
    // So we primarily target logged-in state. 
    // However, the request also says "WHEN THE WEB IS NOT ON USE", which implies general inactivity.
    // But forcing refresh on guests might be annoying.
    // I will check if 'kapilla_user' exists in localStorage. If so, strict timeout.
    // If not, maybe we don't need to force refresh? 
    // The prompt says: "WHEN THE WEB IS NOT ON USE IT SHOULS ATOMATIC REFLESH AND GO BACK TO THE HOME PAGE SIGHT THIS IS TO AVOID OTHER PEOPLE TO USE SOMEONE ACCOUNT"
    // The "SIGHT" (Since?) justification links it to Account Security.
    // So I will only trigger this if a user is logged in.
    
    // Actually, checking localStorage inside the event handler is safer to catch login status changes.
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    const handleLogout = () => {
      const storedUser = localStorage.getItem('kapilla_user');
      
      if (storedUser) {
        // User was logged in, log them out
        localStorage.removeItem('kapilla_user');
        // Force full refresh and go to home
        window.location.href = '/';
      } else {
        // User was not logged in.
        // If they are not on home page, maybe send them home?
        // "GO BACK TO THE HOME PAGE"
        if (pathname !== '/') {
           window.location.href = '/';
        }
      }
    };

    const resetTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(handleLogout, TIMEOUT_MS);
    };

    // Initialize timer
    resetTimer();

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [pathname, router]);

  return null;
}
