import Link from 'next/link';
import { Truck, Package, ArrowRight } from 'lucide-react';
import AccessRestricted from '@/components/AccessRestricted';
import { canViewReports, getReportRole } from '@/lib/reports';

export const dynamic = 'force-dynamic';

export default async function ReportsHomePage() {
  const role = await getReportRole();
  if (!canViewReports(role)) return <AccessRestricted />;

  const options = [
    {
      href: '/staff/reports/transportation',
      title: 'Transportation Report',
      description:
        'Search by waybill number to open a single cargo report, or by company / sender name to generate a report of all their cargo for a chosen period.',
      icon: Truck,
      gradient: 'from-blue-600 to-indigo-600',
    },
    {
      href: '/staff/reports/general-supply',
      title: 'General Supply Report',
      description:
        'Reporting for general supply will be available once that workflow is set up.',
      icon: Package,
      gradient: 'from-emerald-600 to-teal-600',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight">
          Reports
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
          Choose the report you want to generate.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {options.map((option) => (
          <Link
            key={option.href}
            href={option.href}
            className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 transition-all p-8"
          >
            <div
              className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${option.gradient} text-white mb-6`}
            >
              <option.icon className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {option.title}
            </h2>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {option.description}
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
              Open
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
