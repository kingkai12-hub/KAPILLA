'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, MotionConfig, AnimatePresence } from 'framer-motion';
import { Wrench, Loader2, Save, MessageSquare, AlertTriangle, CheckCircle2 } from 'lucide-react';

const DEFAULT_MESSAGE =
  'The system is currently under maintenance. Please check back in a few minutes.';

export default function MaintenancePage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [savedMessage, setSavedMessage] = useState(DEFAULT_MESSAGE);

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

        const res = await fetch(`/api/maintenance?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setEnabled(data?.enabled === true);
            setMessage(data?.message || DEFAULT_MESSAGE);
            setSavedMessage(data?.message || DEFAULT_MESSAGE);
          }
        }
      } catch (err) {
        console.error('Failed to load maintenance status', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const submit = async (nextEnabled: boolean, nextMessage: string, kind: 'toggle' | 'message') => {
    if (!message.trim()) {
      setError('Maintenance message cannot be empty.');
      return;
    }
    setError(null);
    if (kind === 'toggle') setToggling(true);
    else setSaving(true);

    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextEnabled, message: nextMessage }),
      });
      if (res.ok) {
        const data = await res.json();
        setEnabled(data?.enabled === true);
        setMessage(data?.message || nextMessage);
        setSavedMessage(data?.message || nextMessage);
        if (kind === 'message') {
          setSavedFlash(true);
          setTimeout(() => setSavedFlash(false), 2000);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to update maintenance settings');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setToggling(false);
      setSaving(false);
    }
  };

  const handleToggle = () => {
    const next = !enabled;
    const confirmMsg = next
      ? 'Enable maintenance mode? All non-admin users will see a maintenance message.'
      : 'Disable maintenance mode? The system will become available to all users.';
    if (!window.confirm(confirmMsg)) return;
    submit(next, message, 'toggle');
  };

  if (authorized === false) return null;

  const messageDirty = message.trim() !== savedMessage.trim();

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-black text-navy-900 dark:text-white">
            <span
              className={`rounded-xl bg-gradient-to-br p-2.5 shadow-soft ${
                enabled ? 'from-amber-500 to-orange-600' : 'from-slate-500 to-slate-600'
              }`}
            >
              <Wrench className="h-6 w-6 text-white" />
            </span>
            System Maintenance
          </h1>
          <p className="mt-2 text-sm text-charcoal-muted dark:text-navy-300">
            Temporarily restrict access to the platform and manage the notice shown to users.
          </p>
        </div>

        {/* Toggle card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className={`rounded-3xl border p-6 transition-colors ${
            enabled
              ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-700 dark:from-amber-900/20 dark:to-orange-900/20'
              : 'border-navy-100 bg-white dark:border-navy-800 dark:bg-navy-900'
          }`}
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span
                className={`rounded-2xl p-3 shadow-soft ${
                  enabled ? 'bg-amber-500' : 'bg-slate-400 dark:bg-navy-700'
                }`}
              >
                {enabled ? (
                  <AlertTriangle className="h-6 w-6 text-white" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 text-white" />
                )}
              </span>
              <div>
                <h2 className="text-lg font-bold text-navy-900 dark:text-white">
                  Maintenance mode is {enabled ? 'ON' : 'OFF'}
                </h2>
                <p className="mt-1 max-w-xl text-sm text-charcoal-muted dark:text-navy-300">
                  {enabled
                    ? 'Non-admin users currently see the maintenance notice below.'
                    : 'The platform is fully operational for all users.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-label="Toggle maintenance mode"
              onClick={handleToggle}
              disabled={loading || toggling}
              className={`relative inline-flex h-11 w-24 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                enabled
                  ? 'bg-amber-500 focus-visible:ring-amber-500'
                  : 'bg-slate-300 focus-visible:ring-navy-500 dark:bg-navy-700'
              }`}
            >
              <motion.span
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                className="inline-block h-9 w-9 rounded-full bg-white shadow-lg"
                style={{ marginLeft: enabled ? 52 : 4 }}
              />
              {toggling && (
                <Loader2 className="absolute inset-0 m-auto h-5 w-5 animate-spin text-navy-700" />
              )}
            </button>
          </div>
        </motion.div>

        {/* Message editor */}
        <div className="rounded-3xl border border-navy-100 bg-white p-6 dark:border-navy-800 dark:bg-navy-900">
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-navy-500" />
            <h2 className="text-lg font-bold text-navy-900 dark:text-white">Notice Message</h2>
          </div>
          <p className="mb-4 text-sm text-charcoal-muted dark:text-navy-300">
            This is shown to non-admin users while maintenance mode is active.
          </p>

          <label htmlFor="maintenance-message" className="sr-only">
            Maintenance message
          </label>
          <textarea
            id="maintenance-message"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={400}
            className="w-full resize-none rounded-xl border border-navy-100 bg-navy-50/40 px-4 py-3 text-sm text-navy-900 outline-none transition-colors focus:border-navy-500 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
            placeholder={DEFAULT_MESSAGE}
          />
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-charcoal-muted dark:text-navy-400">
              {message.length}/400
            </span>
            <button
              type="button"
              onClick={() => submit(enabled, message, 'message')}
              disabled={saving || loading || !message.trim() || !messageDirty}
              className="inline-flex items-center gap-2 rounded-xl bg-navy-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-accent dark:text-navy-900 dark:hover:bg-accent-dark"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save Message
                </>
              )}
            </button>
          </div>

          <AnimatePresence>
            {savedFlash && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400"
              >
                <CheckCircle2 className="h-4 w-4" /> Message saved
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Preview */}
        <div className="rounded-3xl border border-navy-100 bg-navy-50/50 p-6 dark:border-navy-800 dark:bg-navy-900/50">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-charcoal-muted dark:text-navy-300">
            Live Preview
          </h2>
          <div className="rounded-2xl border border-navy-100 bg-white p-6 text-center shadow-soft dark:border-navy-800 dark:bg-navy-900">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-navy-900 dark:text-white">Under Maintenance</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-charcoal-muted dark:text-navy-300">
              {message || DEFAULT_MESSAGE}
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-charcoal-muted dark:text-navy-300">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            Loading maintenance settings…
          </div>
        )}
      </div>
    </MotionConfig>
  );
}
