'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, Package, LayoutGrid, Phone } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

/**
 * Bottom navigation for the public site.
 *
 * This is the single strongest signal that the site is an app rather than a
 * web page: a fixed, thumb-reachable bar that persists while content scrolls
 * underneath it. It is a floating dock rather than a full-bleed bar so it also
 * reads as intentional on desktop widths.
 *
 * Inside the Android shell the outer wrapper carries the gesture-bar inset, so
 * the dock never sits underneath the system navigation.
 */
const TABS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '#tracking', label: 'Track', icon: Package },
  { href: '#services', label: 'Services', icon: LayoutGrid },
  { href: '#contact', label: 'Contact', icon: Phone },
];

export default function AppTabBar() {
  const [hash, setHash] = useState('');

  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
    >
      <nav aria-label="App navigation" className="glass-strong w-full max-w-md rounded-2xl">
        <ul className="flex items-stretch">
          {TABS.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/' ? hash === '' : hash === href;
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition-colors',
                    isActive ? 'text-navy-900' : 'text-charcoal-muted hover:text-navy-700'
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute top-0 h-0.5 w-8 rounded-full transition-opacity',
                      isActive ? 'bg-accent opacity-100' : 'opacity-0'
                    )}
                  />
                  <Icon aria-hidden="true" className="h-5 w-5" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
