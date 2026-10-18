import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Truck,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  Package,
  FileText,
} from 'lucide-react';
import AccessRestricted from '@/components/AccessRestricted';
import PrintButton from '@/components/PrintButton';
import {
  canViewReports,
  getReportRole,
  parsePeriod,
  periodLabel,
  REPORT_PERIODS,
  searchTransportReport,
  type ReportPeriod,
} from '@/lib/reports';

export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = ['ADMIN', 'ACCOUNTANT', 'MANAGER', 'MD', 'CEO'];

function fmt(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function periodHref(period: ReportPeriod, query: string): string {
  const base = `/staff/reports/transportation?period=${period}`;
  return query ? `${base}&q=${encodeURIComponent(query)}` : base;
}

export default async function TransportationReportPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; period?: string }>;
}) {
  const role = await getReportRole();
  if (!canViewReports(role)) {
    return <AccessRestricted />;
  }

  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q.trim() : '';
  const period = parsePeriod(typeof params.period === 'string' ? params.period : undefined);

  const report = query ? await searchTransportReport(query, period) : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link
        href="/staff/reports"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 print:hidden"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to reports
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Truck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Transportation Report
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Search a waybill number, company name or sender name, then choose the period.
          </p>
        </div>
        {report && (report.waybill || report.rows.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <TransportReportPdfButton report={report} periodLabel={periodLabel(period)} />
            <PrintButton label="Print" />
          </div>
        )}
      </div>

      {/* Search + period */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4 print:hidden">
        <form method="GET" action="/staff/reports/transportation" className="flex flex-col sm:flex-row gap-3">
          <input type="hidden" name="period" value={period} />
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Waybill no. / company name / sender name"
              className="w-full pl-11 pr-4 py-3 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Generate report
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-400 mr-1">Period</span>
          {REPORT_PERIODS.map((r) => (
            <Link
              key={r.key}
              href={periodHref(r.key, query)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                r.key === period
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {!query && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
          <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">
            Enter a waybill number to open a single cargo report, or a company / sender name to
            generate a report of all their cargo.
          </p>
        </div>
      )}

      {/* Single waybill result */}
      {report?.waybill && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Cargo report
                </p>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                  #{report.waybill.waybillNumber}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {report.waybill.origin} → {report.waybill.destination}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                  {report.waybill.status.replace(/_/g, ' ')}
                </span>
                <Link
                  href={`/staff/shipments/${report.waybill.waybillNumber}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-slate-700 text-white hover:bg-slate-800 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Full report
                </Link>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Booked', at: report.waybill.bookedAt, icon: FileText },
              { label: 'Picked up', at: report.waybill.pickedUpAt, icon: Package },
              { label: 'Dispatched', at: report.waybill.dispatchedAt, icon: Truck },
              { label: 'Delivered', at: report.waybill.deliveredAt, icon: CheckCircle2 },
            ].map((step) => (
              <div
                key={step.label}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5"
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

          {/* Sender / receiver / cargo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-4">Sender</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 mt-0.5 text-slate-400" />
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">Name</dt>
                    <dd className="font-semibold text-slate-900 dark:text-white">
                      {report.waybill.senderName}
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 mt-0.5 text-slate-400" />
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">Phone</dt>
                    <dd className="font-semibold text-slate-900 dark:text-white">
                      {report.waybill.senderPhone}
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5 text-slate-400" />
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">Address</dt>
                    <dd className="font-semibold text-slate-900 dark:text-white">
                      {report.waybill.senderAddress || '—'}
                    </dd>
                  </div>
                </div>
              </dl>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-4">Receiver</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 mt-0.5 text-slate-400" />
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">Name</dt>
                    <dd className="font-semibold text-slate-900 dark:text-white">
                      {report.waybill.receiverName}
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 mt-0.5 text-slate-400" />
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">Phone</dt>
                    <dd className="font-semibold text-slate-900 dark:text-white">
                      {report.waybill.receiverPhone}
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5 text-slate-400" />
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">Address</dt>
                    <dd className="font-semibold text-slate-900 dark:text-white">
                      {report.waybill.receiverAddress || '—'}
                    </dd>
                  </div>
                </div>
              </dl>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-4">
              Cargo &amp; processing
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 text-sm">
              <div>
                <p className="text-slate-500 dark:text-slate-400">Route</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {report.waybill.origin} → {report.waybill.destination}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Weight</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {report.waybill.weight != null ? `${report.waybill.weight} kg` : '—'}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Processed by (staff)</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {report.waybill.staff || '—'}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Received by</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {report.waybill.receivedBy || '—'}
                </p>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-slate-500 dark:text-slate-400">Cargo details</p>
                <p className="font-semibold text-slate-900 dark:text-white whitespace-pre-wrap">
                  {report.waybill.cargoDetails || '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company / customer results */}
      {report && !report.waybill && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Cargo report — “{report.query}”
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {periodLabel(period)} · {report.rows.length.toLocaleString()} shipment
                {report.rows.length === 1 ? '' : 's'} found
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
              <thead className="bg-slate-50/60 dark:bg-slate-900/40">
                <tr>
                  {[
                    'Waybill',
                    'Sender',
                    'Receiver',
                    'Route',
                    'Booked',
                    'Picked up',
                    'Dispatched',
                    'Delivered',
                    'Staff',
                    'Status',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {report.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-6 py-10 text-center text-slate-500 dark:text-slate-400"
                    >
                      <p>
                        No shipments found for “{report.query}” in the{' '}
                        {periodLabel(period).toLowerCase()} period.
                      </p>
                      {period !== 'all' && (
                        <p className="mt-3 text-sm">
                          The cargo may have been booked outside this period.{' '}
                          <Link
                            href={`/staff/reports/transportation?period=all&q=${encodeURIComponent(report.query)}`}
                            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Search all time
                          </Link>
                        </p>
                      )}
                    </td>
                  </tr>
                ) : (
                  report.rows.map((row) => (
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
                        {fmt(row.bookedAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {fmt(row.pickedUpAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {fmt(row.dispatchedAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {fmt(row.deliveredAt)}
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
      )}
    </div>
  );
}
