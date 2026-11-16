'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { BellRing, X, ArrowRight } from 'lucide-react';

interface FeedNotification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
}

interface ToastItem {
  id: string;
  title: string;
  message: string;
  link: string | null;
}

const POLL_MS = 20000;
const TOAST_TTL_MS = 8000;

/**
 * The in-app half of the delivery alert. It polls the notification feed while
 * the portal is open, pops the newest unread alert into view, and reports the
 * unread total back so the sidebar badge stays accurate.
 *
 * (A true OS push needs Firebase/FCM and a rebuilt APK; until that is wired the
 * portal itself is the surface that guarantees the alert is not missed.)
 */
export default function NotificationToaster({
  onCountChange,
}: {
  onCountChange?: (count: number) => void;
}) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  // `null` until the first poll completes, so pre-existing notifications are
  // recorded without being mistaken for brand-new arrivals.
  const seenRef = useRef<Set<string> | null>(null);
  const timerRef = useRef<number | null>(null);

  const onCountChangeRef = useRef(onCountChange);
  useEffect(() => {
    onCountChangeRef.current = onCountChange;
  });

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback((item: ToastItem) => {
    setToast(item);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setToast(null), TOAST_TTL_MS);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch('/api/notifications?limit=10', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as {
          notifications?: FeedNotification[];
          unreadCount?: number;
        };
        if (cancelled) return;

        const list = data.notifications ?? [];
        onCountChangeRef.current?.(data.unreadCount ?? 0);

        if (seenRef.current === null) {
          seenRef.current = new Set(list.map((n) => n.id));
          return;
        }

        const seen = seenRef.current;
        const fresh = list.filter((n) => !seen.has(n.id));
        for (const item of fresh) seen.add(item.id);

        const unreadFresh = fresh.find((n) => !n.isRead);
        if (unreadFresh) {
          showToast({
            id: unreadFresh.id,
            title: unreadFresh.title,
            message: unreadFresh.message,
            link: unreadFresh.link,
          });
        }
      } catch {
        // A failed poll is not worth interrupting the user for.
      }
    };

    poll();
    const interval = setInterval(poll, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [showToast]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[55] flex justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-0 sm:justify-end">
      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-start gap-3 p-4">
              <span className="mt-0.5 shrink-0 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-2">
                <BellRing className="h-5 w-5 text-white" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{toast.title}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{toast.message}</p>
                {toast.link && (
                  <Link
                    href={toast.link}
                    onClick={dismiss}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Open
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Dismiss notification"
                className="shrink-0 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
