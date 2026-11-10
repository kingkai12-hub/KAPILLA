'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, MotionConfig, AnimatePresence } from 'framer-motion';
import {
  Search,
  ShieldCheck,
  BarChart3,
  UserCog,
  Loader2,
  CheckCircle2,
  Ban,
  Info,
} from 'lucide-react';

interface AdminUser {
  id: string;
  name?: string | null;
  email: string;
  role: string;
  workId?: string | null;
  isDisabled?: boolean;
  canViewReports?: boolean;
  lastActive?: string | null;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 280, damping: 26 } },
};

/** Accessible animated on/off switch. */
function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-navy-700'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm ${
          checked ? 'ml-6' : 'ml-1'
        }`}
      />
    </button>
  );
}

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'reports', label: 'Reports ON' },
  { id: 'no-reports', label: 'Reports OFF' },
  { id: 'disabled', label: 'Deactivated' },
] as const;

type FilterId = (typeof FILTERS)[number]['id'];

export default function PermissionsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterId>('all');
  const [pending, setPending] = useState<Record<string, boolean>>({});

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

        const res = await fetch('/api/admin/users', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setUsers(data);
        }
      } catch (error) {
        console.error('Failed to load permissions', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const patchUser = async (id: string, payload: Record<string, boolean>) => {
    setPending((p) => ({ ...p, [id]: true }));
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...payload }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers((prev) =>
          prev.map((u) =>
            u.id === id
              ? {
                  ...u,
                  canViewReports:
                    typeof updated.canViewReports === 'boolean'
                      ? updated.canViewReports
                      : u.canViewReports,
                  isDisabled:
                    typeof updated.isDisabled === 'boolean' ? updated.isDisabled : u.isDisabled,
                }
              : u
          )
        );
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to update permission');
      }
    } catch {
      alert('Network error updating permission');
    } finally {
      setPending((p) => ({ ...p, [id]: false }));
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchesQuery =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.workId?.toLowerCase().includes(q);

      const isPrivileged = ['ADMIN', 'MD', 'CEO'].includes(u.role);
      const reportsOn = isPrivileged || !!u.canViewReports;

      const matchesFilter =
        filter === 'all' ||
        (filter === 'reports' && reportsOn) ||
        (filter === 'no-reports' && !reportsOn) ||
        (filter === 'disabled' && !!u.isDisabled);

      return matchesQuery && matchesFilter;
    });
  }, [users, query, filter]);

  if (authorized === false) return null;

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-black text-navy-900 dark:text-white">
              <span className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 shadow-soft">
                <ShieldCheck className="h-6 w-6 text-white" />
              </span>
              Permissions
            </h1>
            <p className="mt-2 text-sm text-charcoal-muted dark:text-navy-300">
              Control what each staff member can access. Changes apply immediately.
            </p>
          </div>
        </div>

        {/* Info note */}
        <div className="flex items-start gap-3 rounded-2xl border border-navy-100 bg-navy-50/60 p-4 text-sm text-charcoal-light dark:border-navy-800 dark:bg-navy-900/60 dark:text-navy-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-navy-500" />
          <p>
            <span className="font-semibold">Reports access</span> controls whether a staff member
            can open the Reports section. Executives and admins always retain access.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email or work ID…"
              className="w-full rounded-xl border border-navy-100 bg-white py-2.5 pl-9 pr-3 text-sm text-navy-900 outline-none transition-colors placeholder:text-charcoal-muted focus:border-navy-500 dark:border-navy-800 dark:bg-navy-900 dark:text-white"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  filter === f.id
                    ? 'bg-navy-800 text-white dark:bg-accent dark:text-navy-900'
                    : 'bg-navy-50 text-charcoal-muted hover:bg-navy-100 dark:bg-navy-800 dark:text-navy-300 dark:hover:bg-navy-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-soft dark:border-navy-800 dark:bg-navy-900">
          <div className="hidden grid-cols-[1.6fr_1fr_1fr_1fr] gap-4 border-b border-navy-100 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-muted dark:border-navy-800 dark:text-navy-300 md:grid">
            <span>Staff Member</span>
            <span>Role</span>
            <span className="text-center">Reports Access</span>
            <span className="text-center">Account Active</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-charcoal-muted dark:text-navy-300">
              <Loader2 className="h-5 w-5 animate-spin text-accent" />
              Loading users…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-charcoal-muted dark:text-navy-300">
              No staff members match your filters.
            </div>
          ) : (
            <motion.ul
              variants={container}
              initial="hidden"
              animate="show"
              className="divide-y divide-navy-100 dark:divide-navy-800"
            >
              <AnimatePresence initial={false}>
                {filtered.map((user) => {
                  const isPrivileged = ['ADMIN', 'MD', 'CEO'].includes(user.role);
                  const reportsOn = isPrivileged || !!user.canViewReports;
                  const busy = !!pending[user.id];
                  return (
                    <motion.li
                      key={user.id}
                      variants={item}
                      layout
                      className="grid grid-cols-1 gap-4 px-6 py-4 transition-colors hover:bg-navy-50/50 dark:hover:bg-navy-800/40 md:grid-cols-[1.6fr_1fr_1fr_1fr] md:items-center"
                    >
                      {/* Identity */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-100 text-sm font-bold text-navy-700 dark:bg-navy-800 dark:text-navy-200">
                          {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-navy-900 dark:text-white">
                            {user.name || 'Unnamed'}
                          </div>
                          <div className="truncate text-xs text-charcoal-muted dark:text-navy-300">
                            {user.email}
                          </div>
                        </div>
                        {busy && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" />}
                      </div>

                      {/* Role */}
                      <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-navy-100 bg-navy-50 px-2.5 py-0.5 text-xs font-semibold text-navy-700 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200">
                          <UserCog className="h-3 w-3" />
                          {user.role}
                        </span>
                      </div>

                      {/* Reports access */}
                      <div className="flex items-center justify-between md:justify-center">
                        <span className="text-xs font-medium text-charcoal-muted dark:text-navy-300 md:hidden">
                          Reports Access
                        </span>
                        <div className="flex items-center gap-2">
                          {isPrivileged ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-4 w-4" /> Always
                            </span>
                          ) : (
                            <Toggle
                              checked={reportsOn}
                              disabled={busy}
                              label={`Toggle reports access for ${user.name || user.email}`}
                              onChange={() =>
                                patchUser(user.id, { canViewReports: !user.canViewReports })
                              }
                            />
                          )}
                        </div>
                      </div>

                      {/* Account active */}
                      <div className="flex items-center justify-between md:justify-center">
                        <span className="text-xs font-medium text-charcoal-muted dark:text-navy-300 md:hidden">
                          Account Active
                        </span>
                        <div className="flex items-center gap-2">
                          {isPrivileged ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-navy-500 dark:text-navy-300">
                              <Ban className="h-4 w-4" /> Protected
                            </span>
                          ) : (
                            <Toggle
                              checked={!user.isDisabled}
                              disabled={busy}
                              label={`Toggle account for ${user.name || user.email}`}
                              onChange={() => patchUser(user.id, { isDisabled: !user.isDisabled })}
                            />
                          )}
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </motion.ul>
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-charcoal-muted dark:text-navy-300">
            <BarChart3 className="h-3.5 w-3.5" />
            Showing {filtered.length} of {users.length} staff members
          </p>
        )}
      </div>
    </MotionConfig>
  );
}
