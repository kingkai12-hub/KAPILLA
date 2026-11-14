'use client';

import { Printer } from 'lucide-react';
import { useIsNativeShell } from '@/lib/native-file';

export default function PrintButton({
  label = 'Print',
  className,
}: {
  label?: string;
  className?: string;
}) {
  const native = useIsNativeShell();

  // The Android WebView has no print engine, so window.print() silently does
  // nothing there. Every page using this button also offers a PDF action that
  // reaches the Android share sheet, so hide it rather than leave a dead
  // control in the app.
  if (native) return null;

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
