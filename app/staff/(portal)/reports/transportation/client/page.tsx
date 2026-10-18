import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Truck,
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  CheckCircle2,
  AlertTriangle,
  Users,
  FileText,
} from 'lucide-react';
import AccessRestricted from '@/components/AccessRestricted';
import PrintButton from '@/components/PrintButton';
import ClientReportButtons from '@/components/ClientReportButtons';
import {
  hasReportAccess,
  parsePeriod,
  periodLabel,
  REPORT_PERIODS,
  searchClients,
  getClientReport,
  type ReportPeriod,
} from '@/lib/reports';

export const dynamic = 'force-dynamic';

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

function statusLabel(status: string): string {
  return status.replace(/_/g, ' ');
}

function periodHref(period: ReportPeriod, clientId: string, query: string): string {
  const params = new URLSearchParams({ period });
  if (clientId) params.set('clientId', clientId);
  if (query) params.set('q', query);
  return `/staff/reports/transportation/client?${params.toString()}`;
}

export default async function ClientReportPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; clientId?: string; period?: string }>;
}) {
  if (!(await hasReportAccess())) {
    return <AccessRestricted />;
  }

  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q.trim() : '';
  const clientId = typeof params.clientId === 'string' ? params.clientId : '';
  const period = parsePeriod(typeof params.period === 'string' ? params.period : undefined);

  const report = clientId ? await getClientReport(clientId, period) : null;
  const matches = !clientId && query ? await searchClients(query, 25) : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link
        href="/staff/reports/transportation"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 print:hidden"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to transportation report
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Client Report
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Full operational history of every parcel a client has transported with us.
          </p>
        </div>
        {report && report.rows.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <ClientReportButtons report={report} periodLabel={periodLabel(period)} />
            <PrintButton label="Print" />
          </div>
        )}
      </div>

      {/* Client search */}
      {!clientId && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4 print:hidden">
          <form
            method="GET"
            action="/staff/reports/transportation/client"
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Client name / client code / phone number"
                className="w-full pl-11 pr-4 py-3 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Find client
            </button>
          </form>

          {query && (
            <div className="divide-y divide-slate-100 dark:divide-slate-700 border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
              {matches.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  <p>
                    No client matches “{query}”. Clients are created automatically from shipments,
                    or registered by staff.
                  </p>
                  <Link
                    href="/staff/clients"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl text-sm font-semibold bg-navy-800 text-white hover:bg-navy-900 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    Register a client
                  </Link>
                </div>
              ) : (
                matches.map((client) => (
                  <Link
                    key={client.id}
                    href={periodHref(period, client.id, query)}
                    className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {client.name}
                        {!client.isActive && (
                          <span className="ml-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                            (inactive)
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {client.code} · {client.phone}
                        {client.contactPerson ? ` · ${client.contactPerson}` : ''}
                      </p>
                    </div>
                    <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                  </Link>
                ))
              )}
            </div>
          )}

          {!query && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
              <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">
                Search for a client to generate their full transportation report.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Client report */}
      {clientId && !report && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-12 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            That client could not be found. It may have been removed.
          </p>
          <Link
            href="/staff/reports/transportation/client"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Search again
          </Link>
        </div>
      )}

      {report && (
        <>
          {/* Client header */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Client report
                </p>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {report.client.name}
                </h2>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1 font-mono">
                  {report.client.code}
                </p>
              </div>
              <div className="text-sm space-y-2">
                <p className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {report.client.phone}
                </p>
                <p className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {report.client.email || '—'}
                </p>
                <p className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <User className="w-4 h-4 text-slate-400" />
                  {report.client.contactPerson || '—'}
                </p>
                <p className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {report.client.address || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Period selector */}
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-400 mr-1">
              Period
            </span>
            {REPORT_PERIODS.map((r) => (
              <Link
                key={r.key}
                href={periodHref(r.key, clientId, query)}
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

          {/* Summary tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: 'Consignments', value: report.totals.total },
              { label: 'Delivered', value: report.totals.delivered },
              { label: 'In transit', value: report.totals.inTransit },
              { label: 'Pending', value: report.totals.pending },
              { label: 'Returned', value: report.totals.returned },
            ].map((tile) => (
              <div
                key={tile.label}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  {tile.label}
                </p>
                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                  {tile.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Total weight
              </p>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {report.totals.totalWeight.toLocaleString()} kg
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Total packages
              </p>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {report.totals.totalPackages.toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Avg. transit time
              </p>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {report.totals.averageTransitHours != null
                  ? `${report.totals.averageTransitHours} h`
                  : '—'}
              </p>
            </div>
          </div>

          {/* Exceptions */}
          {report.exceptions.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-6">
              <h3 className="text-sm font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Needs attention
              </h3>
              <ul className="mt-4 space-y-2">
                {report.exceptions.map((ex) => (
                  <li
                    key={ex.waybillNumber}
                    className="flex flex-wrap items-center justify-between gap-2 text-sm"
                  >
                    <Link
                      href={`/staff/shipments/${ex.waybillNumber}`}
                      className="font-mono font-semibold text-amber-800 dark:text-amber-200 hover:underline"
                    >
                      {ex.waybillNumber}
                    </Link>
                    <span className="text-amber-700 dark:text-amber-300">
                      {ex.reason} · {ex.days} day{ex.days === 1 ? '' : 's'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Consignments */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Consignments — {periodLabel(period)}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {report.rows.length.toLocaleString()} consignment
                {report.rows.length === 1 ? '' : 's'} found
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
                <thead className="bg-slate-50/60 dark:bg-slate-900/40">
                  <tr>
                    {[
                      'Waybill',
                      'Client ref',
                      'Route',
                      'Packages',
                      'Weight',
                      'Service',
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
                        colSpan={12}
                        className="px-6 py-10 text-center text-slate-500 dark:text-slate-400"
                      >
                        <p>
                          No consignments for {report.client.name} in the{' '}
                          {periodLabel(period).toLowerCase()} period.
                        </p>
                        {period !== 'all' && (
                          <p className="mt-3 text-sm">
                            Cargo may have been booked outside this period.{' '}
                            <Link
                              href={periodHref('all', clientId, query)}
                              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Show all time
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
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {row.clientReference || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {row.origin} → {row.destination}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {row.packages ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {row.weight != null ? `${row.weight} kg` : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {row.serviceType || '—'}
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
                            {statusLabel(row.status)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500 text-center print:block">
            KAPILLA Logistics · Client report for {report.client.name} · Generated{' '}
            {fmt(new Date().toISOString())}
          </p>
        </>
      )}
    </div>
  );
}
