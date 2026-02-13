"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ChatBell from '@/components/ChatBell';
import ChatModal from '@/components/ChatModal';
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
  ShieldAlert,
  ChevronRight,
  Truck,
  Sun,
  Moon,
  FileText,
  LayoutTemplate,
  Briefcase,
  HelpCircle,
  HeadphonesIcon,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTheme } from 'next-themes';
import ErrorBoundary from '@/components/ErrorBoundary';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function StaffPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatPeer, setChatPeer] = useState<string>('');
  const [isHelpCenterOpen, setIsHelpCenterOpen] = useState(false);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [pendingPickupCount, setPendingPickupCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    // Check for session
    try {
      const storedUser = localStorage.getItem('kapilla_user');
      console.log('Layout mounting, storedUser:', !!storedUser);
      
      if (!storedUser) {
        if (pathname !== '/staff/login') {
          console.log('No user found in localStorage, redirecting to login...');
          window.location.href = '/staff/login';
        }
      } else {
        const parsed = JSON.parse(storedUser);
        console.log('User found in localStorage:', parsed.email);
        setUser(parsed);
        
        // Background refresh - don't let it block anything
        fetch(`/api/staff/profile?id=${parsed.id}`, { cache: 'no-store' })
          .then(res => res.ok ? res.json() : null)
          .then(fresh => {
            if (fresh) {
              localStorage.setItem('kapilla_user', JSON.stringify(fresh));
              setUser(fresh);
            }
          })
          .catch(err => console.error('Silent profile refresh failed', err));
      }
    } catch (e) {
      console.error('Session check failed', e);
      window.location.href = '/staff/login';
    }

    // Fetch pending pickup requests count
    const fetchPendingCount = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout for layout items
        
        // Optimize: Only fetch pending requests to reduce load
        const res = await fetch('/api/pickup-requests?status=PENDING', { signal: controller.signal });
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
        console.error("Failed to fetch pending requests", error);
      }
    };
    
    fetchPendingCount();
    // Poll every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);

  }, [router]);

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
        console.error("Heartbeat failed", error);
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 60000); // 1 minute
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('kapilla_user');
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch {}
    } finally {
      window.location.assign('/');
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/staff/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'STAFF', 'DRIVER', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO', 'ACCOUNTANT'] },
    { name: 'All Shipments', href: '/staff/shipments', icon: Boxes, roles: ['ADMIN', 'STAFF', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO', 'ACCOUNTANT'] },
    { name: 'Create Shipment', href: '/staff/shipments/create', icon: PackagePlus, roles: ['ADMIN', 'STAFF', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO', 'ACCOUNTANT'] },
    { name: 'Update Tracking', href: '/staff/tracking/update', icon: ScanBarcode, roles: ['ADMIN', 'STAFF', 'DRIVER', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO', 'ACCOUNTANT'] },
    { name: 'Pickup Requests', href: '/staff/pickup-requests', icon: Truck, roles: ['ADMIN', 'STAFF', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO', 'ACCOUNTANT'] },
    { name: 'Documents', href: '/staff/documents', icon: FileText, roles: ['ADMIN', 'STAFF', 'DRIVER', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO', 'ACCOUNTANT'] },
    { name: 'User Management', href: '/staff/admin/users', icon: UserCog, roles: ['ADMIN'] },
    { name: 'Services Showcase', href: '/staff/admin/services', icon: LayoutTemplate, roles: ['ADMIN'] },
    { name: 'Executives', href: '/staff/admin/executives', icon: Briefcase, roles: ['ADMIN'] },
    { name: 'My Profile', href: '/staff/profile', icon: UserCircle, roles: ['ADMIN', 'STAFF', 'DRIVER', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO', 'ACCOUNTANT'] },
  ];

  const quickActions = [
    { name: 'Help Center', icon: HelpCircle, onClick: () => setIsHelpCenterOpen(true), roles: ['ADMIN', 'STAFF', 'DRIVER', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO', 'ACCOUNTANT'] },
    { name: 'Request Pickup', icon: Truck, onClick: () => setIsPickupModalOpen(true), roles: ['ADMIN', 'STAFF', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO', 'ACCOUNTANT'] },
  ];

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-medium tracking-widest uppercase text-xs">System Booting...</p>
        </div>
      </div>
    );
  }

  if (!user && pathname !== '/staff/login') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-medium">Verifying Session...</p>
          <div className="flex flex-col items-center gap-2 mt-4">
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.href = '/staff/login';
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
              Back to Login
            </button>
            <p className="text-[10px] text-slate-600 max-w-[200px] text-center">
              If this screen hangs, please click the button to reset your session and try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If we have a user or we are on login page, render children
  // (Note: login page actually has its own layout or is handled outside this if possible, 
  // but staff/(portal) should always have a user)
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-slate-50 to-blue-200 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 flex font-sans transition-colors duration-300">
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

      {/* Sidebar */}
      <motion.div 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white shadow-2xl transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="h-20 flex items-center px-6 bg-slate-950 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Kapilla Logo" width={40} height={40} className="w-10 h-10 object-contain rounded-lg" />
              <div>
                <span className="font-bold text-lg tracking-tight block leading-none">Kapilla <span className="text-blue-500">Group Ltd</span></span>
                <span className="text-xs text-slate-400 font-medium tracking-wide">STAFF PORTAL</span>
              </div>
            </div>
            <button 
              className="md:hidden ml-auto text-slate-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Menu</div>
            {navigation.map((item) => {
              if (item.roles && (!user?.role || !item.roles.includes(user.role))) return null;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                    isActive 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50" 
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive && "animate-pulse")} />
                  <span className="font-medium">{item.name}</span>
                  
                  {item.name === 'Pickup Requests' && pendingPickupCount > 0 && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-sm">
                      {pendingPickupCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Quick Actions */}
          <div className="px-4 py-3 border-t border-slate-800">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h3>
            <div className="space-y-1">
              {quickActions.map((action, index) => {
                if (!user?.role || !action.roles.includes(user.role)) return null;
                return (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-200 group"
                  >
                    <action.icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                    <span>{action.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950 mt-auto">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all duration-200"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </button>
            <div className="mt-6 text-center text-[10px] font-mono text-slate-600 font-bold tracking-wider opacity-70">
              DEVELOPED BY KAISI
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden text-slate-900 dark:text-slate-100 transition-colors duration-300">
        {/* Header (Desktop & Mobile) */}
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 transition-colors duration-300 pt-[env(safe-area-inset-top)]">
          <div className="flex items-center justify-between min-h-16 px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors md:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              {/* Mobile Logo */}
              <div className="flex items-center gap-2 md:hidden">
                <div className="bg-white p-1 rounded-lg dark:bg-white/90">
                  <img src="/logo.png" alt="Kapilla Logo" className="w-10 h-10 object-contain" />
                </div>
                <span className="font-bold text-slate-900 dark:text-white">Kapilla Portal</span>
              </div>

              {/* Desktop Welcome Message */}
              <div className="hidden md:block">
                 <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                   Welcome back, {user?.name?.split(' ')[0]}
                 </h2>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {mounted && (
                <button 
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              )}

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors relative"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 max-h-96 overflow-y-auto"
                    >
                      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                      </div>
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                          <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No new notifications</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                          {notifications.map((notif, index) => (
                            <div key={index} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                              <p className="text-sm font-medium text-slate-900 dark:text-white">{notif.title}</p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{notif.message}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">{notif.time}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Chat Notifications */}
              {user?.id && (
                <ChatBell
                  userId={user.id}
                  onOpenChat={(peerId) => {
                    setChatPeer(peerId);
                    setChatOpen(true);
                  }}
                />
              )}

              <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{user?.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{user?.role}</p>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => router.push('/staff/profile')}
                    className="focus:outline-none"
                  >
                    {user?.image ? (
                      <img src={user.image} alt="Profile" className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm cursor-pointer" />
                    ) : (
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm cursor-pointer">
                        {user?.name?.charAt(0)}
                      </div>
                    )}
                  </button>
                  {/* Mobile Text Under Profile */}
                  <div className="sm:hidden flex flex-col items-center">
                    <p className="text-[10px] font-bold text-slate-900 dark:text-white leading-none">
                        {user?.name?.split(' ').pop()}
                    </p>
                    <p className="text-[8px] text-slate-500 dark:text-slate-400 leading-none mt-0.5">
                        {user?.role}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </main>
        {chatOpen && user?.id && chatPeer && (
          <ChatModal
            isOpen={chatOpen}
            onClose={() => setChatOpen(false)}
            userId={user.id}
            peerId={chatPeer}
          />
        )}
        
        {/* Help Center Modal */}
        <HelpCenterModal
          isOpen={isHelpCenterOpen}
          onClose={() => setIsHelpCenterOpen(false)}
        />
        
        {/* Pickup Request Modal */}
        <PickupRequestModal
          isOpen={isPickupModalOpen}
          onClose={() => setIsPickupModalOpen(false)}
        />
      </div>
    </div>
  );
}
