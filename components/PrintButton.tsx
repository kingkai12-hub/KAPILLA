'use client';

import { Printer } from 'lucide-react';

export default function PrintButton({
  label = 'Print',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={
        className ??
        'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-colors'
      }
    >
      <Printer className="w-4 h-4" />
      {label}
    </button>
  );
}
