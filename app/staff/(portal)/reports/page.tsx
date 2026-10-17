import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import {
  Package,
  CheckCheck,
  Timer,
  Wallet,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  ShieldAlert,
} from 'lucide-react';
import { db } from '@/lib/db';
import { getReportSummary, parsePeriod, REPORT_PERIODS, periodLabel } from '@/lib/reports';
import ReportExportButtons from '@/components/ReportExportButtons';

export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = ['ADMIN', 'ACCOUNTANT', 'MANAGER', 'MD', 'CEO'];

const TIMEOUT_MS = 5000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), timeoutMs)),
  ]);
}

const currency = new Intl.NumberFormat('en-TZ', {
  style: 'currency',
  currency: 'TZS',
  maximumFractionDigits: 0,
});

function fmtDateTime(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const period = parsePeriod(typeof params.period === 'string' ? params.period : undefined);
  const customer =
    typeof params.customer === 'string' && params.customer.trim() ? params.customer.trim() : '';

  // Role gate — guarded so a DB hiccup degrades to "restricted" instead of crashing.
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
    console.error('[REPORTS] role check failed', error);
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
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Reports are limited to administrators and finance roles.
          </p>
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

  const summary = await getReportSummary(period, customer);
  const maxMonth = Math.max(1, ...summary.shipments.byMonth.map((m) => m.count));

  const kpis = [
    {
      label: 'Shipments',
      value: summary.shipments.total.toLocaleString(),
      sub: periodLabel(period),
      icon: Package,
      tone: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Delivered',
      value: summary.shipments.delivered.toLocaleString(),
      sub: 'Completed shipments',
      icon: CheckCheck,
      tone: 'from-emerald-500 to-emerald-600',
    },
    {
      label: 'Avg. Delivery Time',
      value:
        summary.shipments.avgLeadTimeDays === null
          ? '—'
          : `${summary.shipments.avgLeadTimeDays} d`,
      sub: 'From registration to delivery',
      icon: Timer,
      tone: 'from-purple-500 to-purple-600',
    },
    {
      label: 'Invoiced',
      value: currency.format(summary.invoices.invoiced),
      sub: `${summary.invoices.count.toLocaleString()} invoices (excludes drafts)`,
      icon: Wallet,
      tone: 'from-slate-500 to-slate-600',
    },
    {
      label: 'Collected',
      value: currency.format(summary.invoices.collected),
      sub: 'Marked as paid',
      icon: TrendingUp,
      tone: 'from-teal-500 to-teal-600',
    },
    {
      label: 'Outstanding',
      value: currency.format(summary.invoices.outstanding),
      sub: 'Invoiced but not yet paid',
      icon: AlertTriangle,
      tone: 'from-orange-500 to-orange-600',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight">
            Reports &amp; Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Operations and revenue performance — {periodLabel(period).toLowerCase()}
            {customer ? ` · filtered by “${customer}”` : ''}.
          </p>
        </div>
        <div className="flex flex-col gap-3 items-start lg:items-end">
          <form method="GET" action="/staff/reports" className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="period" value={period} />
            <input
              type="text"
              name="customer"
              defaultValue={customer}
              placeholder="Company / customer name"
              className="px-4 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
            {customer && (
              <Link
                href={`/staff/reports?period=${period}`}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-colors"
              >
                Clear
              </Link>
            )}
          </form>
          <div className="flex flex-wrap items-center gap-2">
            {REPORT_PERIODS.map((r) => (
              <Link
                key={r.key}
                href={`/staff/reports?period=${r.key}${customer ? `&customer=${encodeURIComponent(customer)}` : ''}`}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                  r.key === period
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                {r.label}
              </Link>
            ))}
            <ReportExportButtons summary={summary} />
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {kpi.label}
                </p>
                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                  {kpi.value}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{kpi.sub}</p>
              </div>
              <div
                className={`shrink-0 p-3 rounded-xl bg-gradient-to-br ${kpi.tone} text-white shadow-sm`}
              >
                <kpi.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Shipments by month */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Shipments — last 6 months
          </h3>
        </div>
        <div className="flex items-end justify-between gap-3 h-40">
          {summary.shipments.byMonth.map((m) => (
            <div key={m.key} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {m.count}
              </span>
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-indigo-400 min-h-[4px]"
                style={{ height: `${Math.max((m.count / maxMonth) * 100, 2)}%` }}
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cargo report — full waybill detail */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Cargo report
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Every shipment with its pick-up, dispatch and delivery times.
              {customer ? ` Filtered by “${customer}”.` : ''}
            </p>
          </div>
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {summary.shipments.rows.length.toLocaleString()} shown
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
            <thead className="bg-slate-50/60 dark:bg-slate-900/40">
              <tr>
                {['Waybill', 'Sender', 'Receiver', 'Route', 'Booked', 'Picked up', 'Dispatched', 'Delivered', 'Staff', 'Status'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {summary.shipments.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-8 text-center text-slate-500 dark:text-slate-400"
                  >
                    No shipments in this period.
                  </td>
                </tr>
              ) : (
                summary.shipments.rows.map((row) => (
                  <tr key={row.waybillNumber}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link
                        href={`/staff/shipments/${row.waybillNumber}`}
                        className="font-mono font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {row.waybillNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {row.senderName}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {row.receiverName}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {row.origin} → {row.destination}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {fmtDateTime(row.bookedAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {fmtDateTime(row.pickedUpAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {fmtDateTime(row.dispatchedAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {fmtDateTime(row.deliveredAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {row.staff || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                        {row.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By status */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Shipments by status</h3>
          </div>
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {summary.shipments.byStatus.length === 0 ? (
                <tr>
                  <td className="px-6 py-6 text-center text-slate-500 dark:text-slate-400">
                    No shipments in this period.
                  </td>
                </tr>
              ) : (
                summary.shipments.byStatus.map((s) => (
                  <tr key={s.status}>
                    <td className="px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {s.status.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-3 text-sm text-right font-bold text-slate-900 dark:text-white">
                      {s.count.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Top routes */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Top routes</h3>
          </div>
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {summary.shipments.byRoute.length === 0 ? (
                <tr>
                  <td className="px-6 py-6 text-center text-slate-500 dark:text-slate-400">
                    No routes in this period.
                  </td>
                </tr>
              ) : (
                summary.shipments.byRoute.map((r) => (
                  <tr key={r.route}>
                    <td className="px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {r.route}
                    </td>
                    <td className="px-6 py-3 text-sm text-right font-bold text-slate-900 dark:text-white">
                      {r.count.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top customers */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Top customers by invoiced amount
            </h3>
          </div>
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
            <thead className="bg-slate-50/60 dark:bg-slate-900/40">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Invoiced
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Collected
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {summary.invoices.topCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-6 text-center text-slate-500 dark:text-slate-400"
                  >
                    No invoices in this period.
                  </td>
                </tr>
              ) : (
                summary.invoices.topCustomers.map((c) => (
                  <tr key={c.customer}>
                    <td className="px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {c.customer}
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-slate-900 dark:text-white">
                      {currency.format(c.invoiced)}
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-emerald-600 dark:text-emerald-400">
                      {currency.format(c.collected)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Ageing of unpaid invoices */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Unpaid invoices — ageing
            </h3>
          </div>
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
            <thead className="bg-slate-50/60 dark:bg-slate-900/40">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Age
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Invoices
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {summary.invoices.ageing.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-6 text-center text-slate-500 dark:text-slate-400"
                  >
                    Nothing outstanding.
                  </td>
                </tr>
              ) : (
                summary.invoices.ageing.map((b) => (
                  <tr key={b.label}>
                    <td className="px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {b.label}
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-slate-900 dark:text-white">
                      {b.count.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-slate-900 dark:text-white">
                      {currency.format(b.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Generated {new Date(summary.generatedAt).toLocaleString()} · Revenue figures exclude draft
        invoices.
      </p>
    </div>
  );
}
