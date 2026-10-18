'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, Pencil, Power } from 'lucide-react';
import type { ClientSummary } from '@/lib/reports';

const inputClass =
  'w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-navy-700 focus:border-transparent';
const labelClass = 'block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5';

export default function ClientEditForm({ client }: { client: ClientSummary }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function send(payload: Record<string, unknown>) {
    const res = await fetch('/api/customers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: client.id, ...payload }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update client');
    return json;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const data = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await send({
        name: data.get('name'),
        phone: data.get('phone'),
        contactPerson: data.get('contactPerson'),
        email: data.get('email'),
        address: data.get('address'),
        notes: data.get('notes'),
      });
      setSuccess('Client updated');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update client');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive() {
    setError('');
    setSuccess('');
    setToggling(true);
    try {
      await send({ isActive: !client.isActive });
      setSuccess(client.isActive ? 'Client deactivated' : 'Client activated');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update client');
    } finally {
      setToggling(false);
    }
  }

  return (
    <details className="mt-3 group">
      <summary className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-navy-700 dark:text-accent hover:underline">
        <Pencil className="w-3.5 h-3.5" />
        Edit client
      </summary>

      <form onSubmit={handleSubmit} className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor={`name-${client.id}`}>
            Client name *
          </label>
          <input
            id={`name-${client.id}`}
            name="name"
            required
            maxLength={120}
            defaultValue={client.name}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor={`phone-${client.id}`}>
            Phone number *
          </label>
          <input
            id={`phone-${client.id}`}
            name="phone"
            required
            maxLength={40}
            defaultValue={client.phone}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor={`contact-${client.id}`}>
            Contact person
          </label>
          <input
            id={`contact-${client.id}`}
            name="contactPerson"
            maxLength={120}
            defaultValue={client.contactPerson ?? ''}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor={`email-${client.id}`}>
            Email
          </label>
          <input
            id={`email-${client.id}`}
            name="email"
            type="email"
            maxLength={160}
            defaultValue={client.email ?? ''}
            className={inputClass}
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass} htmlFor={`address-${client.id}`}>
            Address
          </label>
          <input
            id={`address-${client.id}`}
            name="address"
            maxLength={240}
            defaultValue={client.address ?? ''}
            className={inputClass}
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass} htmlFor={`notes-${client.id}`}>
            Notes
          </label>
          <textarea
            id={`notes-${client.id}`}
            name="notes"
            rows={2}
            maxLength={500}
            defaultValue={client.notes ?? ''}
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

        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-accent text-navy-900 hover:bg-accent-dark transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save changes'}
          </button>

          <button
            type="button"
            onClick={handleToggleActive}
            disabled={toggling}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors disabled:opacity-60"
          >
            {toggling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Power className="w-4 h-4" />
            )}
            {client.isActive ? 'Deactivate client' : 'Activate client'}
          </button>
        </div>
      </form>
    </details>
  );
}
