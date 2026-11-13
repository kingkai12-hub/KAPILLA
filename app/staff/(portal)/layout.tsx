'use client';

import React, { useState, useEffect } from 'react';
import Link, { useLinkStatus } from 'next/link';
import HelpCenterModal from '@/components/HelpCenterModal';
import PickupRequestModal from '@/components/PickupRequestModal';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  PackagePlus,
  Boxes,
  ScanBarcode,
  LogOut,
  Menu,
  X,
  UserCircle,
  UserCog,
  Users,
  Receipt,
  Truck,
  Sun,
  Moon,
  FileText,
  LayoutTemplate,
  Briefcase,
  MessageSquare,
  BarChart3,
  Loader2,
  ShieldCheck,
  Wrench,
  Megaphone,
  KeyRound,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTheme } from 'next-themes';
import ErrorBoundary from '@/components/ErrorBoundary';
import { SessionManager, clearSession } from '@/lib/session-manager';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

/** Shows a spinner on the sidebar item whose page is still loading. */
function NavPendingIndicator() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span className="absolute right-4 top-1/2 -translate-y-1/2">
      <Loader2 className="w-4 h-4 animate-spin text-accent" />
    </span>
  );
}

export default function StaffPortalLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Desktop: sidebar stays hidden until the cursor reaches its location (left edge)
  const [sidebarHover, setSidebarHover] = useState(false);
  const [user, setUser] = useState<{
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    image?: string;
    canViewReports?: boolean;
    canViewInvoices?: boolean;
  } | null>(null);
  const [isHelpCenterOpen, setIsHelpCenterOpen] = useState(false);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [pendingPickupCount, setPendingPickupCount] = useState(0);
  const sessionManagerRef = React.useRef<SessionManager | null>(null);
  // The content pane is the only scrolling surface in the app shell, so the
  // browser's automatic window scroll reset never reaches it.
  const mainRef = React.useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);

    // Initialize session manager
    const handleSessionTimeout = () => {
      console.log('Session expired due to inactivity');
      clearSession();
      window.location.href = '/staff/login?reason=timeout';
    };

    sessionManagerRef.current = new SessionManager(handleSessionTimeout);
    sessionManagerRef.current.start();

    // Check for session
    const checkSession = async () => {
      try {
        // Always verify with the server first — localStorage is just a cache
        const res = await fetch('/api/auth/session', { cache: 'no-store' });
        if (res.ok) {
          const fresh = await res.json();
          localStorage.setItem('kapilla_user', JSON.stringify(fresh));
          setUser(fresh);

          // Background profile refresh
          fetch(`/api/staff/profile?id=${fresh.id}`, { cache: 'no-store' })
            .then((r) => (r.ok ? r.json() : null))
            .then((profile) => {
              if (profile) {
                localStorage.setItem('kapilla_user', JSON.stringify(profile));
                setUser(profile);
              }
            })
            .catch(() => {});
        } else {
          // Session invalid — clear and redirect to login
          clearSession();
          window.location.href = '/staff/login';
        }
      } catch (e) {
        console.error('Session check failed', e);
        // Network error — try localStorage as fallback before redirecting
        const storedUser = localStorage.getItem('kapilla_user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            clearSession();
            window.location.href = '/staff/login';
          }
        } else {
          clearSession();
          window.location.href = '/staff/login';
        }
      }
    };

    checkSession();

    // Fetch pending pickup requests count
    const fetchPendingCount = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout for layout items

        // Optimize: Only fetch pending requests to reduce load
        const res = await fetch('/api/pickup-requests?status=PENDING', {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          // Safety check if data is array
          if (Array.isArray(data)) {
            // Since we filtered by status=PENDING in API, data.length is the count
            setPendingPickupCount(data.length);
          }
        }
      } catch (error) {
        // Silently fail for layout counters
        console.error('Failed to fetch pending requests', error);
      }
    };

    fetchPendingCount();
    // Poll every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);

    return () => {
      clearInterval(interval);
      // Cleanup session manager
      if (sessionManagerRef.current) {
        sessionManagerRef.current.stop();
      }
    };
    // Run once per session. Re-running this on every route change fired three
    // extra API calls per navigation (session, profile, pickup count) and made
    // the portal feel slow. Server components re-validate auth on every page.
  }, []);

  // Heartbeat Effect
  useEffect(() => {
    if (!user?.id) return;

    const sendHeartbeat = async () => {
      try {
        await fetch('/api/auth/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });
      } catch (error) {
        console.error('Heartbeat failed', error);
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 60000); // 1 minute
    return () => clearInterval(interval);
  }, [user]);

  // Collapse the menu whenever a new page is opened
  useEffect(() => {
    setSidebarHover(false);
    setSidebarOpen(false);
  }, [pathname]);

  // Reset the content pane scroll on navigation — the window no longer scrolls.
  useEffect(() => {
    const pane = mainRef.current;
    if (!pane) return;
    pane.scrollTop = 0;
    pane.scrollLeft = 0;
  }, [pathname]);

  // Close the menu with the Escape key
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarHover(false);
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      // Stop session manager
      if (sessionManagerRef.current) {
        sessionManagerRef.current.stop();
      }

      // Clear all session data
      clearSession();

      // Call logout API
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (error) {
        console.error('Logout API error:', error);
      }
    } finally {
      // Always redirect to home page
      window.location.assign('/');
    }
  };

  const navSections = [
    {
      label: 'Menu',
      items: [
        {
          name: 'Dashboard',
          href: '/staff/dashboard',
          icon: LayoutDashboard,
          roles: [
            'ADMIN',
            'STAFF',
            'DRIVER',
            'OPERATION_MANAGER',
            'MANAGER',
            'MD',
            'CEO',
            'ACCOUNTANT',
          ],
        },
        {
          name: 'All Shipments',
          href: '/staff/shipments',
          icon: Boxes,
          roles: ['ADMIN', 'STAFF', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO', 'ACCOUNTANT'],
        },
        {
          name: 'Clients',
          href: '/staff/clients',
          icon: Users,
          roles: ['ADMIN', 'STAFF', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO', 'ACCOUNTANT'],
        },
        {
          name: 'Reports',
          href: '/staff/reports',
          icon: BarChart3,
          requiresReportAccess: true,
        },
        {
          name: 'Create Shipment',
          href: '/staff/shipments/create',
          icon: PackagePlus,
          roles: ['ADMIN', 'STAFF', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO', 'ACCOUNTANT'],
        },
        {
          name: 'Update Tracking',
          href: '/staff/tracking/update',
          icon: ScanBarcode,
          roles: [
            'ADMIN',
            'STAFF',
            'DRIVER',
            'OPERATION_MANAGER',
            'MANAGER',
            'MD',
            'CEO',
            'ACCOUNTANT',
          ],
        },
        {
          name: 'Invoices',
          href: '/staff/invoices',
          icon: Receipt,
          requiresInvoiceAccess: true,
        },
        {
          name: 'Pickup Requests',
          href: '/staff/pickup-requests',
          icon: Truck,
          roles: ['ADMIN', 'STAFF', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO', 'ACCOUNTANT'],
        },
        {
          name: 'Documents',
          href: '/staff/documents',
          icon: FileText,
          roles: [
            'ADMIN',
            'STAFF',
            'DRIVER',
            'OPERATION_MANAGER',
            'MANAGER',
            'MD',
            'CEO',
            'ACCOUNTANT',
          ],
        },
        {
          name: 'Chat',
          href: '/staff/chat',
          icon: MessageSquare,
          roles: [
            'ADMIN',
            'STAFF',
            'DRIVER',
            'OPERATION_MANAGER',
            'MANAGER',
            'MD',
            'CEO',
            'ACCOUNTANT',
          ],
        },
        {
          name: 'My Profile',
          href: '/staff/profile',
          icon: UserCircle,
          roles: [
            'ADMIN',
            'STAFF',
            'DRIVER',
            'OPERATION_MANAGER',
            'MANAGER',
            'MD',
            'CEO',
            'ACCOUNTANT',
          ],
        },
      ],
    },
    {
      label: 'Administration',
      items: [
        { name: 'Admin Dashboard', href: '/staff/admin', icon: ShieldCheck, roles: ['ADMIN'] },
        {
          name: 'User Management',
          href: '/staff/admin/users',
          icon: UserCog,
          roles: ['ADMIN'],
        },
        {
          name: 'Permissions',
          href: '/staff/admin/permissions',
          icon: KeyRound,
          roles: ['ADMIN'],
        },
        {
          name: 'System Maintenance',
          href: '/staff/admin/maintenance',
          icon: Wrench,
          roles: ['ADMIN'],
        },
        {
          name: 'Advertisements',
          href: '/staff/admin/advertisements',
          icon: Megaphone,
          roles: ['ADMIN'],
        },
        {
          name: 'Services Showcase',
          href: '/staff/admin/services',
          icon: LayoutTemplate,
          roles: ['ADMIN'],
        },
        { name: 'Executives', href: '/staff/admin/executives', icon: Briefcase, roles: ['ADMIN'] },
      ],
    },
  ];

  /** A nav item is visible when its role list (if any) includes the user's role. */
  const isItemVisible = (navItem: {
    roles?: string[];
    requiresReportAccess?: boolean;
    requiresInvoiceAccess?: boolean;
    href: string;
    name: string;
    icon: typeof LayoutDashboard;
  }) => {
    if (navItem.roles && (!user?.role || !navItem.roles.includes(user.role))) return false;
    if (navItem.requiresReportAccess && !(user?.role === 'ADMIN' || user?.canViewReports)) {
      return false;
    }
    if (
      navItem.requiresInvoiceAccess &&
      !(
        user?.role === 'ADMIN' ||
        user?.role === 'MD' ||
        user?.role === 'CEO' ||
        user?.canViewInvoices
      )
    ) {
      return false;
    }
    return true;
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-96 h-96 bg-accent/20 rounded-full blur-3xl -top-48 -left-48 animate-pulse" />
          <div className="absolute w-96 h-96 bg-navy-200/50 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-1000" />
        </div>

        {/* Welcome Content */}
        <div className="relative z-10 flex flex-col items-center gap-8 px-4">
          {/* Logo — transparent, no background */}
          <div className="relative">
            <Image
              src="/logo.png"
              alt="Kapilla Logo"
              width={100}
              height={100}
              className="w-40 h-40 md:w-56 md:h-56 object-contain"
            />
          </div>

          {/* Welcome Text */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-navy-900 animate-fade-in">
              Welcome
            </h1>
            <p className="text-xl md:text-2xl font-semibold text-navy-700 animate-fade-in-delay-2">
              Staff Portal
            </p>
            <p className="text-sm md:text-base text-navy-600 italic font-medium animate-fade-in-delay-3 max-w-md">
              &ldquo;Delivering Excellence, Connecting Africa&rdquo;
            </p>
          </div>

          {/* Loading Spinner */}
          <div className="flex flex-col items-center gap-4 animate-fade-in-delay-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-navy-200 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-navy-600 font-medium tracking-widest uppercase text-xs animate-pulse">
              Loading Portal...
            </p>
          </div>
        </div>

        {/* Add custom animations */}
        <style jsx>{`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in {
            animation: fade-in 0.8s ease-out forwards;
          }
          .animate-fade-in-delay-1 {
            animation: fade-in 0.8s ease-out 0.2s forwards;
            opacity: 0;
          }
          .animate-fade-in-delay-2 {
            animation: fade-in 0.8s ease-out 0.4s forwards;
            opacity: 0;
          }
          .animate-fade-in-delay-3 {
            animation: fade-in 0.8s ease-out 0.6s forwards;
            opacity: 0;
          }
          .animate-fade-in-delay-4 {
            animation: fade-in 0.8s ease-out 0.8s forwards;
            opacity: 0;
          }
        `}</style>
      </div>
    );
  }

  if (!user && pathname !== '/staff/login') {
    // Show the same beautiful welcome screen instead of technical error message
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-96 h-96 bg-accent/20 rounded-full blur-3xl -top-48 -left-48 animate-pulse" />
          <div className="absolute w-96 h-96 bg-navy-200/50 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-1000" />
        </div>

        {/* Welcome Content */}
        <div className="relative z-10 flex flex-col items-center gap-8 px-4">
          {/* Logo — transparent, no background */}
          <div className="relative">
            <Image
              src="/logo.png"
              alt="Kapilla Logo"
              width={100}
              height={100}
              className="w-40 h-40 md:w-56 md:h-56 object-contain"
            />
          </div>

          {/* Welcome Text */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-navy-900 animate-fade-in">
              Welcome
            </h1>
            <p className="text-xl md:text-2xl font-semibold text-navy-700 animate-fade-in-delay-2">
              Staff Portal
            </p>
            <p className="text-sm md:text-base text-navy-600 italic font-medium animate-fade-in-delay-3 max-w-md">
              &ldquo;Delivering Excellence, Connecting Africa&rdquo;
            </p>
          </div>

          {/* Loading Spinner */}
          <div className="flex flex-col items-center gap-4 animate-fade-in-delay-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-navy-200 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-navy-600 font-medium tracking-widest uppercase text-xs animate-pulse">
              Loading Portal...
            </p>
          </div>
        </div>

        {/* Add custom animations */}
        <style jsx>{`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in {
            animation: fade-in 0.8s ease-out forwards;
          }
          .animate-fade-in-delay-1 {
            animation: fade-in 0.8s ease-out 0.2s forwards;
            opacity: 0;
          }
          .animate-fade-in-delay-2 {
            animation: fade-in 0.8s ease-out 0.4s forwards;
            opacity: 0;
          }
          .animate-fade-in-delay-3 {
            animation: fade-in 0.8s ease-out 0.6s forwards;
            opacity: 0;
          }
          .animate-fade-in-delay-4 {
            animation: fade-in 0.8s ease-out 0.8s forwards;
            opacity: 0;
          }
        `}</style>
      </div>
    );
  }

  // If we have a user or we are on login page, render children
  // (Note: login page actually has its own layout or is handled outside this if possible,
  // but staff/(portal) should always have a user)
  if (!user) return null;

  return (
    <div className="app-shell h-dvh max-h-dvh overflow-hidden flex font-sans transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Left-edge hotspot — reveals the menu when the cursor reaches its location */}
      <div
        onMouseEnter={() => setSidebarHover(true)}
        className="group fixed left-0 top-0 z-40 hidden h-full w-2 md:block"
        aria-hidden="true"
      >
        <span className="absolute left-0 top-1/2 h-16 w-1 -translate-y-1/2 rounded-r-full bg-navy-300 transition-all duration-300 group-hover:h-24 group-hover:w-1.5 group-hover:bg-navy-500 dark:bg-navy-700" />
      </div>

      {/* Sidebar */}
      <motion.div
        onMouseEnter={() => setSidebarHover(true)}
        onMouseLeave={() => setSidebarHover(false)}
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 glass-menu text-navy-900 transform transition-[transform,visibility] duration-300 ease-out',
          sidebarOpen ? 'translate-x-0 visible' : '-translate-x-full invisible',
          sidebarOpen || sidebarHover
            ? 'md:translate-x-0 md:visible'
            : 'md:-translate-x-full md:invisible'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="h-28 flex items-center px-6 border-b border-white/40 dark:border-navy-800/60">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <Image
                src="/logo.png"
                alt="Kapilla Logo"
                width={96}
                height={96}
                className="w-24 h-24 object-contain"
              />
            </Link>
            <button
              className="md:hidden ml-auto text-navy-500 hover:text-navy-900 dark:text-navy-300 dark:hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            {navSections.map((section) => {
              const visibleItems = section.items.filter(isItemVisible);
              if (visibleItems.length === 0) return null;

              return (
                <div key={section.label} className="mb-6 last:mb-0">
                  <div className="mb-3 flex items-center gap-3 px-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-navy-500 dark:text-navy-300">
                      {section.label}
                    </span>
                    <span className="h-px flex-1 bg-navy-100 dark:bg-navy-800" />
                  </div>
                  <div className="space-y-2">
                    {visibleItems.map((item, index) => {
                      const isActive = pathname === item.href;

                      return (
                        <motion.div
                          key={item.name}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.035 * index, duration: 0.25, ease: 'easeOut' }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Link
                            href={item.href}
                            prefetch
                            onClick={() => {
                              setSidebarOpen(false);
                              setSidebarHover(false);
                            }}
                            className={cn(
                              'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative',
                              isActive
                                ? 'bg-white/80 text-navy-900 shadow-soft-lg dark:bg-navy-800 dark:text-white'
                                : 'text-navy-600 hover:bg-white/60 hover:text-navy-900 dark:text-navy-300 dark:hover:bg-navy-800/60 dark:hover:text-white'
                            )}
                          >
                            {isActive && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r bg-accent" />
                            )}
                            <item.icon
                              className={cn(
                                'w-5 h-5 transition-transform group-hover:scale-110',
                                isActive && 'text-accent'
                              )}
                            />
                            <span className="font-medium">{item.name}</span>

                            {item.name === 'Pickup Requests' && pendingPickupCount > 0 && (
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-accent text-navy-900 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-sm">
                                {pendingPickupCount}
                              </span>
                            )}

                            <NavPendingIndicator />
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-white/40 dark:border-navy-800/60 mt-auto">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 dark:text-red-300 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:border-red-500/20 rounded-xl transition-all duration-200"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </button>
            <div className="mt-6 text-center text-[10px] font-mono text-navy-400 dark:text-navy-500 font-bold tracking-wider opacity-70">
              DEVELOPED BY KAISI
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden text-charcoal dark:text-slate-100 transition-colors duration-300">
        {/* Header (Desktop & Mobile) */}
        <header className="sticky top-0 z-30 border-b border-navy-100 bg-white shadow-soft pt-[env(safe-area-inset-top)]">
          <div className="flex items-center justify-between gap-3 min-h-16 px-4 sm:px-6">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen((open) => !open)}
                aria-label="Toggle navigation menu"
                aria-expanded={sidebarOpen}
                className="shrink-0 p-2 -ml-2 text-charcoal-muted hover:text-navy-900 hover:bg-navy-50 rounded-lg transition-colors"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Mobile logo — the lockup already carries the wordmark */}
              <div className="flex items-center md:hidden">
                <Image
                  src="/kapila logo.png"
                  alt="Kapilla Group Ltd"
                  width={801}
                  height={255}
                  className="h-6 w-auto object-contain"
                />
              </div>

              {/* Desktop Welcome Message */}
              <div className="hidden md:block min-w-0">
                <h2 className="text-lg font-semibold text-navy-900 truncate">
                  Welcome back, {user?.name?.split(' ')[0]}
                </h2>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4 shrink-0">
              {mounted && (
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  aria-label="Toggle colour theme"
                  className="p-2 rounded-full bg-navy-50 text-charcoal-muted hover:text-navy-900 hover:text-accent transition-colors"
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              )}

              <div className="flex items-center gap-3 pl-4 border-l border-navy-100">
                <div className="text-right hidden sm:block max-w-[10rem]">
                  <p className="text-sm font-bold text-navy-900 leading-none truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-charcoal-muted mt-1 truncate">{user?.role}</p>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => router.push('/staff/profile')}
                    className="focus:outline-none"
                  >
                    {user?.image ? (
                      <Image
                        src={user.image}
                        alt="Profile"
                        width={40}
                        height={40}
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border-2 border-white shadow-sm cursor-pointer"
                      />
                    ) : (
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-navy-800 flex items-center justify-center text-accent font-bold shadow-sm cursor-pointer">
                        {user?.name?.charAt(0)}
                      </div>
                    )}
                  </button>
                  {/* Mobile Text Under Profile */}
                  <div className="sm:hidden flex flex-col items-center">
                    <p className="text-[10px] font-bold text-navy-900 leading-none">
                      {user?.name?.split(' ').pop()}
                    </p>
                    <p className="text-[8px] text-charcoal-muted leading-none mt-0.5">
                      {user?.role}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main
          ref={mainRef}
          className="app-shell-main flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain p-4 md:p-8 lg:p-10"
        >
          <div className="max-w-7xl mx-auto">
            <ErrorBoundary key={pathname}>{children}</ErrorBoundary>
          </div>
        </main>

        {/* Help Center Modal */}
        <HelpCenterModal isOpen={isHelpCenterOpen} onClose={() => setIsHelpCenterOpen(false)} />

        {/* Pickup Request Modal */}
        <PickupRequestModal
          isOpen={isPickupModalOpen}
          onClose={() => setIsPickupModalOpen(false)}
        />
      </div>
    </div>
  );
}
