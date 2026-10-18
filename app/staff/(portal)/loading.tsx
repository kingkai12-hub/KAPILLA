export default function PortalLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-live="polite">
      {/* Page title + action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-3">
          <div className="h-7 w-56 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-80 max-w-full rounded bg-slate-200/70 dark:bg-slate-800/70" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* Toolbar */}
      <div className="h-12 w-full rounded-xl bg-slate-200/70 dark:bg-slate-800/70" />

      {/* Card grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="space-y-3 p-5">
              <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-7 w-16 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>

      {/* Table / list */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="h-12 border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-0 dark:border-slate-800/60"
          >
            <div className="h-4 flex-1 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-32 rounded bg-slate-200/70 dark:bg-slate-800/70" />
            <div className="h-4 w-20 rounded bg-slate-200/70 dark:bg-slate-800/70" />
            <div className="h-6 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>
        ))}
      </div>

      <p className="text-center text-sm font-medium text-slate-400 dark:text-slate-500">
        Loading…
      </p>
    </div>
  );
}
