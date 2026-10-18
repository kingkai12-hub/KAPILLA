'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, UserPlus } from 'lucide-react';

const inputClass =
  'w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-navy-700 focus:border-transparent';
const labelClass = 'block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5';

export default function ClientRegistrationForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const form = event.currentTarget;
    const data = new FormData(form);

    setSaving(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          phone: data.get('phone'),
          contactPerson: data.get('contactPerson'),
          email: data.get('email'),
          address: data.get('address'),
          notes: data.get('notes'),
        }),
      });
      const payload = await res.json();

      if (!res.ok) {
        setError(payload.error || 'Failed to register client');
      } else {
        setSuccess(`Client registered with code ${payload.code}`);
        form.reset();
        router.refresh();
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <details className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <summary className="flex items-center gap-2 px-6 py-4 cursor-pointer text-sm font-semibold text-navy-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900/40">
        <UserPlus className="w-5 h-5 text-navy-700 dark:text-accent" />
        Register a new client
      </summary>

      <form
        onSubmit={handleSubmit}
        className="px-6 pb-6 pt-2 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div>
          <label className={labelClass} htmlFor="client-name">
            Client name *
          </label>
          <input id="client-name" name="name" required maxLength={120} className={inputClass} />
        </div>

        <div>
          <label className={labelClass} htmlFor="client-phone">
            Phone number *
          </label>
          <input id="client-phone" name="phone" required maxLength={40} className={inputClass} />
        </div>

        <div>
          <label className={labelClass} htmlFor="client-contact">
            Contact person
          </label>
          <input id="client-contact" name="contactPerson" maxLength={120} className={inputClass} />
        </div>

        <div>
          <label className={labelClass} htmlFor="client-email">
            Email
          </label>
          <input
            id="client-email"
            name="email"
            type="email"
            maxLength={160}
            className={inputClass}
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="client-address">
            Address
          </label>
          <input id="client-address" name="address" maxLength={240} className={inputClass} />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="client-notes">
            Notes
          </label>
          <textarea
            id="client-notes"
            name="notes"
            rows={2}
            maxLength={500}
            className={inputClass}
          />
        </div>

        {error && (
          <p className="md:col-span-2 text-sm text-red-600 dark:text-red-400 font-medium">
            {error}
          </p>
        )}
        {success && (
          <p className="md:col-span-2 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            {success}
          </p>
        )}

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-accent text-navy-900 hover:bg-accent-dark transition-colors disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save client'}
          </button>
        </div>
      </form>
    </details>
  );
}
