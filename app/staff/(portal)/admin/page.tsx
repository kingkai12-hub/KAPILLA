'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, MotionConfig } from 'framer-motion';
import {
  Users,
  ShieldCheck,
  Wrench,
  Megaphone,
  LayoutTemplate,
  Briefcase,
  ArrowRight,
  UsersRound,
  Crown,
  Wifi,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface AdminUser {
  id: string;
  role: string;
  isDisabled?: boolean;
  canViewReports?: boolean;
  lastActive?: string | null;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 24 } },
};

const features = [
  {
    title: 'User Management',
    description: 'Create, edit, and remove staff accounts and roles.',
    href: '/staff/admin/users',
    icon: Users,
    tint: 'from-navy-600 to-navy-800',
  },
  {
    title: 'Permissions',
    description: 'Control per-user access such as report visibility.',
    href: '/staff/admin/permissions',
    icon: ShieldCheck,
    tint: 'from-emerald-500 to-teal-600',
  },
  {
    title: 'System Maintenance',
    description: 'Toggle maintenance mode and edit the notice message.',
    href: '/staff/admin/maintenance',
    icon: Wrench,
    tint: 'from-amber-500 to-orange-600',
  },
  {
    title: 'Advertisements',
    description: 'Manage ads displayed on the public home page.',
    href: '/staff/admin/advertisements',
    icon: Megaphone,
    tint: 'from-rose-500 to-pink-600',
  },
  {
    title: 'Services Showcase',
    description: 'Curate the services highlighted on the website.',
    href: '/staff/admin/services',
    icon: LayoutTemplate,
    tint: 'from-indigo-500 to-blue-600',
  },
  {
    title: 'Executives',
    description: 'Maintain the leadership profiles shown publicly.',
    href: '/staff/admin/executives',
    icon: Briefcase,
    tint: 'from-slate-600 to-navy-800',
  },
];

export default function AdminHubPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [maintenance, setMaintenance] = useState<boolean | null>(null);
  const [stats, setStats] = useState({ total: 0, admins: 0, online: 0, reports: 0 });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session', { cache: 'no-store' });
        if (!sessionRes.ok) {
          router.replace('/staff/login');
          return;
        }
        const me = await sessionRes.json();
        if (me?.role !== 'ADMIN') {
          router.replace('/staff/dashboard');
          return;
        }
        if (cancelled) return;
        setAuthorized(true);

        const [usersRes, maintenanceRes] = await Promise.all([
          fetch('/api/admin/users', { cache: 'no-store' }),
          fetch(`/api/maintenance?t=${Date.now()}`, { cache: 'no-store' }),
        ]);

        if (usersRes.ok) {
          const users: AdminUser[] = await usersRes.json();
          const now = Date.now();
          setStats({
            total: users.length,
            admins: users.filter((u) => ['ADMIN', 'MD', 'CEO'].includes(u.role)).length,
            online: users.filter(
              (u) => u.lastActive && now - new Date(u.lastActive).getTime() < 2 * 60 * 1000
            ).length,
            reports: users.filter((u) => u.canViewReports || u.role === 'ADMIN').length,
          });
        }

        if (maintenanceRes.ok) {
          const data = await maintenanceRes.json();
          setMaintenance(data?.enabled === true);
        }
      } catch (error) {
        console.error('Failed to load admin hub', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (authorized === false) return null;

  const statTiles = [
    {
      label: 'Staff Accounts',
      value: stats.total,
      icon: UsersRound,
      tone: 'text-navy-600 dark:text-navy-200',
    },
    {
      label: 'Administrators',
      value: stats.admins,
      icon: Crown,
      tone: 'text-purple-600 dark:text-purple-300',
    },
    {
      label: 'Online Now',
      value: stats.online,
      icon: Wifi,
      tone: 'text-emerald-600 dark:text-emerald-300',
    },
    {
      label: 'Report Access',
      value: stats.reports,
      icon: BarChart3,
      tone: 'text-amber-600 dark:text-amber-300',
    },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
        {/* Header */}
        <motion.div variants={item}>
          <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-navy-800 to-navy-500 dark:from-white dark:to-navy-300">
            Administration
          </h1>
          <p className="mt-2 font-medium text-charcoal-muted dark:text-navy-300">
            Manage users, permissions, system settings and public content from one place.
          </p>
        </motion.div>

        {/* System status banner */}
        <motion.div variants={item}>
          <div
            className={`flex flex-col gap-4 rounded-3xl border p-6 transition-colors sm:flex-row sm:items-center sm:justify-between ${
              maintenance
                ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-700 dark:from-amber-900/20 dark:to-orange-900/20'
                : 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white dark:border-emerald-800 dark:from-emerald-900/20 dark:to-navy-900'
            }`}
          >
            <div className="flex items-start gap-4">
              <span
                className={`rounded-2xl p-3 shadow-soft ${
                  maintenance ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              >
                {maintenance ? (
                  <AlertTriangle className="h-6 w-6 text-white" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 text-white" />
                )}
              </span>
              <div>
                <h2 className="text-lg font-bold text-navy-900 dark:text-white">
                  {loading || maintenance === null
                    ? 'Checking system status…'
                    : maintenance
                      ? 'Maintenance mode is ON'
                      : 'System is operational'}
                </h2>
                <p className="mt-1 text-sm text-charcoal-muted dark:text-navy-300">
                  {maintenance
                    ? 'Non-admin users currently see a maintenance notice.'
                    : 'All users have full access to the platform.'}
                </p>
              </div>
            </div>
            <Link
              href="/staff/admin/maintenance"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-navy-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-900 dark:bg-accent dark:text-navy-900 dark:hover:bg-accent-dark"
            >
              <Wrench className="h-4 w-4" />
              Manage Maintenance
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={item} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statTiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <div
                key={tile.label}
                className="group relative overflow-hidden rounded-2xl border border-navy-100 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg dark:border-navy-800 dark:bg-navy-900"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-muted dark:text-navy-300">
                      {tile.label}
                    </p>
                    <p className="mt-2 text-3xl font-black text-navy-900 dark:text-white">
                      {loading ? '—' : tile.value.toLocaleString()}
                    </p>
                  </div>
                  <span className="rounded-xl bg-navy-50 p-2.5 dark:bg-navy-800">
                    <Icon className={`h-5 w-5 ${tile.tone}`} />
                  </span>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Feature cards */}
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-charcoal-muted dark:text-navy-300">
            Admin Tools
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link key={feature.href} href={feature.href} className="group block">
                  <motion.div
                    variants={item}
                    whileHover={{ y: -6 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative h-full overflow-hidden rounded-2xl border border-navy-100 bg-white p-6 shadow-soft transition-shadow duration-300 hover:shadow-soft-lg dark:border-navy-800 dark:bg-navy-900"
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className={`rounded-2xl bg-gradient-to-br ${feature.tint} p-3 shadow-soft`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </span>
                      <ArrowRight className="h-5 w-5 -translate-x-1 text-navy-300 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:text-accent group-hover:opacity-100" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-navy-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-sm text-charcoal-muted dark:text-navy-300">
                      {feature.description}
                    </p>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-charcoal-muted dark:text-navy-300">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            Loading admin data…
          </div>
        )}
      </motion.div>
    </MotionConfig>
  );
}
