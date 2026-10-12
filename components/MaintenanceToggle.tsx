'use client';

import { useState, useEffect } from 'react';
import { Wrench, Loader2 } from 'lucide-react';

interface MaintenanceStatus {
  enabled: boolean;
  message: string;
}

export default function MaintenanceToggle() {
  const [status, setStatus] = useState<MaintenanceStatus>({
    enabled: false,
    message: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/maintenance?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error('Failed to fetch maintenance status', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleToggle = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);

    const newEnabled = !status.enabled;
    const confirmMsg = newEnabled
      ? 'Enable maintenance mode? All non-admin users will see a maintenance message.'
      : 'Disable maintenance mode? The system will become available to all users.';

    if (!window.confirm(confirmMsg)) {
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newEnabled, message: status.message }),
      });

      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to update maintenance mode');
      }
    } catch (e) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`rounded-3xl p-6 border transition-all duration-300 ${
        status.enabled
          ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-300 dark:border-amber-700'
          : 'bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={`rounded-2xl p-4 shadow-lg ${
              status.enabled
                ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                : 'bg-gradient-to-br from-slate-400 to-slate-500'
            }`}
          >
            <Wrench className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              System Maintenance Mode
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
              {status.enabled
                ? 'Maintenance is ACTIVE. Non-admin users see a maintenance message.'
                : 'Maintenance is OFF. The system is fully operational for all users.'}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={saving || loading}
          className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed shrink-0 ${
            status.enabled
              ? 'bg-amber-500 focus:ring-amber-500'
              : 'bg-slate-300 dark:bg-slate-600 focus:ring-slate-400'
          }`}
          aria-pressed={status.enabled}
          role="switch"
        >
          <span
            className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
              status.enabled ? 'translate-x-11' : 'translate-x-1'
            }`}
          />
          {saving && (
            <Loader2 className="absolute inset-0 m-auto h-5 w-5 text-slate-600 animate-spin" />
          )}
        </button>
      </div>

      {error && (
        <p className="mt-4 text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
