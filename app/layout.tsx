import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import RefreshHandler from '@/components/RefreshHandler';
import IdleLogout from '@/components/IdleLogout';
import ServiceWorkerCleanup from '@/components/ServiceWorkerCleanup';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getMaintenanceStatus } from '@/lib/maintenance';
import { Wrench, ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://kapilla-logistics.vercel.app'),
  title: {
    default: 'Kapilla Logistics',
    template: '%s | Kapilla Logistics',
  },
  description: 'Global Logistics & Tracking System - Fast, Reliable, Secure.',
  alternates: {
    canonical: 'https://kapilla-logistics.vercel.app',
  },
  openGraph: {
    title: 'Kapilla Logistics',
    description: 'Track your shipment in real-time across our global network.',
    url: 'https://kapilla-logistics.vercel.app/',
    siteName: 'Kapilla Logistics',
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 600,
        alt: 'Kapilla Logistics Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kapilla Logistics',
    description: 'Global Logistics & Tracking System',
    images: ['/logo.png'],
  },
  icons: {
    icon: '/favicon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let isMaintenance = false;
  let maintenanceMessage = '';
  let isAdmin = false;
  let isLoginRoute = false;

  try {
    const status = await getMaintenanceStatus();
    isMaintenance = status.enabled;
    maintenanceMessage = status.message;
  } catch (e) {
    console.error('[LAYOUT] maintenance check failed', e);
  }

  if (isMaintenance) {
    // The login page must stay reachable so an admin can sign in and turn
    // maintenance off — otherwise nobody can get back in.
    const pathname = (await headers()).get('x-pathname') ?? '';
    isLoginRoute = pathname === '/staff/login';

    if (!isLoginRoute) {
      try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('kapilla_uid')?.value;
        if (userId) {
          // Race the lookup against a timeout: a slow database must never hang
          // every page, and a false "not admin" would lock the admin out.
          const user = await Promise.race([
            db.user.findUnique({
              where: { id: userId },
              select: { role: true },
            }),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
          ]);
          isAdmin = user?.role === 'ADMIN';
        }
      } catch (e) {
        console.error('[LAYOUT] admin check failed', e);
      }
    }
  }

  if (isMaintenance && !isAdmin && !isLoginRoute) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ServiceWorkerCleanup />
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 px-4">
              <div className="max-w-lg w-full text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-amber-500/20 mb-8 animate-pulse">
                  <Wrench className="w-12 h-12 text-amber-400" />
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                  System Under Maintenance
                </h1>
                <p className="text-lg text-navy-200 mb-8">{maintenanceMessage}</p>
                <div className="inline-flex items-center gap-2 px-5 py-3 bg-navy-800/60 rounded-full text-sm text-navy-300 border border-navy-700">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  We will be back shortly
                </div>
                <div className="mt-10">
                  <Link
                    href="/staff/login"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-accent text-navy-900 text-sm font-semibold hover:bg-accent-dark transition-colors"
                  >
                    Staff sign in
                  </Link>
                </div>
              </div>
            </div>
          </ThemeProvider>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {isMaintenance && isAdmin && (
            <div className="sticky top-0 z-[100] w-full bg-amber-500 border-b border-amber-600 px-4 py-2.5 flex items-center justify-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-900 shrink-0" />
              <p className="text-sm font-semibold text-amber-900 text-center">
                Maintenance mode is ACTIVE — non-admin users see a maintenance message. Turn it off
                from the Dashboard when done.
              </p>
            </div>
          )}
          <ServiceWorkerCleanup />
          <RefreshHandler />
          <IdleLogout />
          {children}
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
