import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Download, ShieldCheck, Smartphone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Download the App',
  description:
    'Download the Kapilla Group Android app (APK) directly — track consignments and request pickups. Version 1.0.0.',
  alternates: { canonical: 'https://kapilla-logistics.vercel.app/download' },
  robots: { index: true, follow: true },
};

const APK_PATH = '/downloads/kapilla-group-1.0.0.apk';
const VERSION = '1.0.0';
const SIZE = '3.1 MB';

export default function DownloadPage() {
  return (
    <div className="min-h-screen safe-page">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-navy-700 hover:text-navy-900 transition-colors"
        >
          <ArrowLeft aria-hidden="true" className="w-4 h-4" />
          Back to Kapilla Group
        </Link>

        <div className="mt-6 glass-card p-6 sm:p-10">
          <span className="glass inline-flex p-2.5 rounded-md">
            <Smartphone aria-hidden="true" className="w-5 h-5 text-navy-700" />
          </span>

          <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-navy-900">
            Get the Kapilla Group app
          </h1>
          <p className="mt-4 text-sm text-charcoal-light leading-relaxed">
            Track a consignment by waybill number, request a pickup, and keep our freight and supply
            services in your pocket. The Android app is available to download and install directly
            while the Google Play release is being prepared.
          </p>

          <a
            href={APK_PATH}
            download
            className="mt-7 inline-flex items-center justify-center gap-2.5 w-full sm:w-auto rounded-lg bg-navy-800 px-7 py-4 text-base font-semibold text-white shadow-lg hover:bg-navy-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-500 transition-colors"
          >
            <Download aria-hidden="true" className="w-5 h-5" />
            Download for Android
          </a>

          <p className="mt-3 text-xs text-charcoal-muted">
            Version {VERSION} &middot; {SIZE} &middot; Android 7.0 or newer
          </p>

          <p className="mt-4 text-xs text-charcoal-muted break-all">
            Direct link:{' '}
            <a
              href={APK_PATH}
              className="font-medium text-navy-700 hover:text-navy-900 underline underline-offset-2"
            >
              kapillagroup.vercel.app{APK_PATH}
            </a>
          </p>

          <h2 className="mt-10 text-xl font-semibold text-navy-900">How to install</h2>
          <ol className="mt-4 space-y-4 text-sm text-charcoal-light leading-relaxed list-decimal pl-5">
            <li>
              Tap <span className="font-semibold text-charcoal">Download for Android</span> and wait
              for the file to finish saving.
            </li>
            <li>Open the downloaded file from your notification shade or your Downloads folder.</li>
            <li>
              Android will ask whether you allow installing apps from this source. Tap{' '}
              <span className="font-semibold text-charcoal">Settings</span>, turn on{' '}
              <span className="font-semibold text-charcoal">Allow from this source</span>, then go
              back and tap <span className="font-semibold text-charcoal">Install</span>.
            </li>
            <li>Open the app and enter your waybill number to follow your cargo.</li>
          </ol>

          <h2 className="mt-10 text-xl font-semibold text-navy-900">Why Android shows a warning</h2>
          <p className="mt-3 text-sm text-charcoal-light leading-relaxed">
            Apps installed outside Google Play are treated as coming from an unknown source, so
            Android warns you before installing. That warning is expected for a direct download. The
            file is the official Kapilla Group build, signed with the company release key.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-navy-900">Google Play</h2>
          <p className="mt-3 text-sm text-charcoal-light leading-relaxed">
            The Google Play listing is in progress. Once it is live you will be able to install and
            update the app from the Play Store instead, and we will point this page there.
          </p>

          <div className="mt-8 flex items-start gap-3 rounded-lg border border-navy-100 bg-navy-50 p-4">
            <ShieldCheck aria-hidden="true" className="w-5 h-5 text-navy-700 shrink-0 mt-0.5" />
            <p className="text-sm text-charcoal-light leading-relaxed">
              The app requests one permission only — internet access — and does not ask for your
              location, camera, contacts or files. See our{' '}
              <Link
                href="/privacy"
                className="font-medium text-navy-700 hover:text-navy-900 underline underline-offset-2"
              >
                privacy policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
