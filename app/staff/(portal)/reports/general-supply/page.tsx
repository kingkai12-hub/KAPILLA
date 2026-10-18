import Link from 'next/link';
import { ArrowLeft, Package, Construction } from 'lucide-react';
import AccessRestricted from '@/components/AccessRestricted';
import { canViewReports, getReportRole } from '@/lib/reports';

export const dynamic = 'force-dynamic';

export default async function GeneralSupplyReportPage() {
  const role = await getReportRole();
  if (!canViewReports(role)) return <AccessRestricted />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/staff/reports"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to reports
      </Link>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/30 mb-6">
          <Package className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3">
          General Supply Report
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Coming soon. This report will be available once the general supply workflow is set up.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
          <Construction className="w-4 h-4" />
          In development
        </div>
      </div>
    </div>
  );
}
