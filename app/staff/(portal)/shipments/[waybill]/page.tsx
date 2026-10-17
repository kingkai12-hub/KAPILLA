import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  Truck,
  MapPin,
  User,
  Phone,
  ShieldAlert,
  ClipboardList,
} from 'lucide-react';
import { db } from '@/lib/db';
import PrintButton from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = ['ADMIN', 'STAFF', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO', 'ACCOUNTANT'];
const TIMEOUT_MS = 5000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), timeoutMs)),
  ]);
}

function fmt(value: Date | string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const currency = new Intl.NumberFormat('en-TZ', {
  style: 'currency',
  currency: 'TZS',
  maximumFractionDigits: 0,
});

interface Step {
  key: string;
  label: string;
  at: Date | string | null | undefined;
  icon: React.ComponentType<{ className?: string }>;
}

export default async function WaybillReportPage({
  params,
}: {
  params: Promise<{ waybill: string }>;
}) {
  const { waybill } = await params;

  // Role gate — degrade to "restricted" instead of crashing on a DB hiccup.
  let role: string | null = null;
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('kapilla_uid')?.value;
    if (userId) {
      const user = await withTimeout(
        db.user.findUnique({ where: { id: userId }, select: { role: true } })
      );
      role = user?.role ?? null;
    }
  } catch (error) {
    console.error('[WAYBILL] role check failed', error);
  }

  if (!role || !ALLOWED_ROLES.includes(role)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
            <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3">
            Access Restricted
          </h1>
          <Link
            href="/staff/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const shipment = await withTimeout(
    db.shipment.findFirst({
      where: { waybillNumber: { equals: waybill, mode: 'insensitive' } },
      include: { events: { orderBy: { timestamp: 'asc' } } },
    })
  ).catch((error) => {
    console.error('[WAYBILL] load failed', error);
    return null;
  });

  if (!shipment) notFound();

  const steps: Step[] = [
    { key: 'booked', label: 'Booked', at: shipment.createdAt, icon: ClipboardList },
    { key: 'picked', label: 'Picked up', at: shipment.pickedUpAt, icon: Package },
    { key: 'dispatched', label: 'Dispatched', at: shipment.dispatchedAt, icon: Truck },
    { key: 'delivered', label: 'Delivered', at: shipment.deliveredAt, icon: CheckCircle2 },
  ];

  const processedBy = shipment.createdByName || shipment.dispatcherName || '—';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <Link
          href="/staff/shipments"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to shipments
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/api/shipments/${shipment.waybillNumber}/pdf`}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Waybill PDF
          </Link>
          {shipment.currentStatus === 'DELIVERED' && (
            <Link
              href={`/staff/shipments/${shipment.waybillNumber}/pod`}
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              Proof of Delivery
            </Link>
          )}
          <PrintButton label="Print report" />
        </div>
      </div>

      {/* Waybill identity */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Waybill / Cargo report
            </p>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              #{shipment.waybillNumber}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {shipment.origin} → {shipment.destination}
            </p>
          </div>
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
            {shipment.currentStatus.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step) => (
          <div
            key={step.key}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5"
          >
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <step.icon className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wide">{step.label}</span>
            </div>
            <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
              {step.at ? fmt(step.at) : 'Pending'}
            </p>
          </div>
        ))}
      </div>

      {/* Sender / Receiver */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-4">Sender</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 mt-0.5 text-slate-400" />
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Name</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">
                  {shipment.senderName}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 mt-0.5 text-slate-400" />
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Phone</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">
                  {shipment.senderPhone}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 mt-0.5 text-slate-400" />
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Address</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">
                  {shipment.senderAddress || '—'}
                </dd>
              </div>
            </div>
          </dl>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-4">Receiver</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 mt-0.5 text-slate-400" />
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Name</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">
                  {shipment.receiverName}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 mt-0.5 text-slate-400" />
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Phone</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">
                  {shipment.receiverPhone}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 mt-0.5 text-slate-400" />
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Address</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">
                  {shipment.receiverAddress || '—'}
                </dd>
              </div>
            </div>
          </dl>
        </div>
      </div>

      {/* Cargo + processing */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-4">
          Cargo &amp; processing
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 text-sm">
          <div>
            <p className="text-slate-500 dark:text-slate-400">Route</p>
            <p className="font-semibold text-slate-900 dark:text-white">
              {shipment.origin} → {shipment.destination}
            </p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Weight</p>
            <p className="font-semibold text-slate-900 dark:text-white">
              {shipment.weight != null ? `${shipment.weight} kg` : '—'}
            </p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Price</p>
            <p className="font-semibold text-slate-900 dark:text-white">
              {shipment.price != null ? currency.format(shipment.price) : '—'}
            </p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Processed by (staff)</p>
            <p className="font-semibold text-slate-900 dark:text-white">{processedBy}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Received by</p>
            <p className="font-semibold text-slate-900 dark:text-white">
              {shipment.receivedBy || '—'}
            </p>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-slate-500 dark:text-slate-400">Cargo details</p>
            <p className="font-semibold text-slate-900 dark:text-white whitespace-pre-wrap">
              {shipment.cargoDetails || '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Full event history */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Update history ({shipment.events.length})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Every delivery and vehicle-location update with the staff member who recorded it.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
            <thead className="bg-slate-50/60 dark:bg-slate-900/40">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Date &amp; time
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Remarks
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Staff
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {shipment.events.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-6 text-center text-slate-500 dark:text-slate-400"
                  >
                    No updates recorded yet.
                  </td>
                </tr>
              ) : (
                shipment.events.map((event) => (
                  <tr key={event.id}>
                    <td className="px-6 py-3 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {fmt(event.timestamp)}
                    </td>
                    <td className="px-6 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                      {event.status.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-700 dark:text-slate-300">
                      {event.location}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">
                      {event.remarks || '—'}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-700 dark:text-slate-300">
                      {event.staffName || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Report generated {fmt(new Date())} · Kapilla Logistics.
      </p>
    </div>
  );
}
