import Link from 'next/link';
import { Users, Search, FileText, Phone, Mail } from 'lucide-react';
import ClientRegistrationForm from '@/components/ClientRegistrationForm';
import ClientEditForm from '@/components/ClientEditForm';
import { listClients } from '@/lib/reports';

export const dynamic = 'force-dynamic';

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q.trim() : '';
  const clients = await listClients(query, 200);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-navy-900 dark:text-white tracking-tight flex items-center gap-3">
          <Users className="w-8 h-8 text-navy-700 dark:text-accent" />
          Clients
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
          Clients are created automatically from shipments, or registered here by staff.
        </p>
      </div>

      <ClientRegistrationForm />

      <form method="GET" action="/staff/clients" className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search by client name / code / phone number"
            className="w-full pl-11 pr-4 py-3 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-navy-700 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 rounded-xl text-sm font-semibold bg-navy-800 text-white hover:bg-navy-900 transition-colors"
        >
          Search
        </button>
      </form>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {clients.length} client{clients.length === 1 ? '' : 's'}
            {query ? ` matching “${query}”` : ''}
          </p>
        </div>

        {clients.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            {query
              ? `No client matches “${query}”. Register them above to start tracking their report.`
              : 'No clients registered yet. Use the form above to register the first one.'}
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {clients.map((client) => (
              <div key={client.id} className="px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {client.name}
                      {!client.isActive && (
                        <span className="ml-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                          (inactive)
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span>{client.code}</span>
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {client.phone}
                      </span>
                      {client.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {client.email}
                        </span>
                      )}
                    </p>
                  </div>
                  <Link
                    href={`/staff/reports/transportation/client?clientId=${client.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-navy-800 dark:text-accent border border-navy-100 dark:border-navy-800 hover:bg-navy-50 dark:hover:bg-navy-800 transition-colors shrink-0"
                  >
                    <FileText className="w-4 h-4" />
                    View report
                  </Link>
                </div>
                <ClientEditForm client={client} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
