'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BellRing, CheckCheck, ArrowRight, Inbox, Loader2, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

/** Short, human relative time — "just now", "12m ago", "3h ago", then a date. */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Central notification centre. Delivery alerts and other system messages that
 * used to pile up on the dashboard land here instead, so the dashboard can stay
 * an overview and nothing gets missed.
 */
export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=100', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      const data = (await res.json()) as { notifications?: NotificationItem[] };
      setItems(data.notifications ?? []);
    } catch (error) {
      console.error('[NOTIFICATIONS] failed to load', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(id: string) {
    // Optimistic — the badge and styling update instantly.
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (error) {
      console.error('[NOTIFICATIONS] mark read failed', error);
    }
  }

  async function markAllRead() {
    if (items.every((n) => n.isRead)) return;
    setMarkingAll(true);
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
    } catch (error) {
      console.error('[NOTIFICATIONS] mark all read failed', error);
    } finally {
      setMarkingAll(false);
    }
  }

  async function remove(id: string) {
    // Optimistic — the row disappears immediately. Restored if the call fails.
    const previous = items;
    setItems((prev) => prev.filter((n) => n.id !== id));
    try {
      const res = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    } catch (error) {
      console.error('[NOTIFICATIONS] delete failed', error);
      setItems(previous);
    }
  }

  async function clearAll() {
    if (items.length === 0) return;
    setClearingAll(true);
    const previous = items;
    setItems([]);
    try {
      const res = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    } catch (error) {
      console.error('[NOTIFICATIONS] clear all failed', error);
      setItems(previous);
    } finally {
      setClearingAll(false);
    }
  }

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Notifications
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}.`
              : 'You are all caught up.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={markAllRead}
            disabled={markingAll || unreadCount === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {markingAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4" />
            )}
            Mark all as read
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={clearingAll || items.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {clearingAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Clear all
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-slate-500 dark:text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading notifications…
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Inbox className="w-12 h-12 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              No notifications yet.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {items.map((item) => (
              <li
                key={item.id}
                className={cn(
                  'flex items-stretch transition-colors group',
                  item.isRead
                    ? 'hover:bg-slate-50/80 dark:hover:bg-slate-700/40'
                    : 'bg-amber-50/60 hover:bg-amber-50 dark:bg-amber-900/10 dark:hover:bg-amber-900/20'
                )}
              >
                <Link
                  href={item.link || '#'}
                  onClick={() => {
                    if (!item.isRead) markRead(item.id);
                  }}
                  className="flex min-w-0 flex-1 items-start gap-4 p-4"
                >
                  <span
                    className={cn(
                      'mt-0.5 shrink-0 rounded-xl p-2',
                      item.isRead
                        ? 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
                        : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
                    )}
                  >
                    <BellRing className="w-5 h-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </p>
                      {!item.isRead && (
                        <span
                          className="shrink-0 w-2 h-2 rounded-full bg-amber-500"
                          aria-label="Unread"
                        />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {item.message}
                    </p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      {relativeTime(item.createdAt)}
                    </p>
                  </div>
                  {item.link && (
                    <ArrowRight className="mt-2 w-4 h-4 shrink-0 text-slate-400 transition-transform duration-300 group-hover:translate-x-1" />
                  )}
                </Link>
                <div className="flex items-center pr-3">
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    aria-label="Delete notification"
                    title="Delete"
                    className="rounded-full p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
