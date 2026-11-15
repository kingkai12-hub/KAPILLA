'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Download, Smartphone } from 'lucide-react';
import { APP_RELEASE, compareAppVersions } from '@/lib/app-release';

/**
 * Blocks the native shell when the installed APK is older than the release the
 * website serves.
 *
 * The check runs in the web app, so raising `APP_RELEASE.requiredVersion` and
 * deploying is enough to force every older install to update — the APK itself
 * carries no gate.
 *
 * It fails open on purpose: a device where the native bridge cannot answer must
 * never be locked out of an app it is otherwise able to use.
 */
export default function AppUpdateGate() {
  const pathname = usePathname();
  const [installedVersion, setInstalledVersion] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;

        const { App } = await import('@capacitor/app');
        const { version } = await App.getInfo();
        if (cancelled || !version) return;

        if (compareAppVersions(version, APP_RELEASE.requiredVersion) < 0) {
          setInstalledVersion(version);
        }
      } catch (e) {
        console.error('[APP UPDATE GATE] version check failed', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // The download page has to stay reachable — otherwise the screen that asks the
  // user to update is the screen that stops them from updating.
  if (!installedVersion || pathname === APP_RELEASE.downloadPath) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="app-update-title"
      aria-describedby="app-update-body"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-navy-900/75 px-4 backdrop-blur-sm"
    >
      <div className="glass-strong w-full max-w-md rounded-3xl p-8 text-center">
        <span className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent/30">
          <Smartphone aria-hidden="true" className="h-8 w-8 text-navy-900" />
        </span>

        <h2 id="app-update-title" className="text-2xl font-bold tracking-tight text-navy-900">
          New release available
        </h2>

        <p
          id="app-update-body"
          className="mt-3 text-sm leading-relaxed text-charcoal-light text-pretty"
        >
          A new version of the Kapilla Group app has been released. Update to version{' '}
          {APP_RELEASE.requiredVersion} to continue using the app.
        </p>

        <Link
          href={APP_RELEASE.downloadPath}
          className="mt-8 inline-flex w-full items-center justify-center gap-2.5 rounded-lg bg-navy-800 px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-navy-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-500"
        >
          <Download aria-hidden="true" className="h-4 w-4" />
          Update now
        </Link>

        <p className="mt-4 text-xs text-charcoal-muted">You are on version {installedVersion}</p>
      </div>
    </div>
  );
}
