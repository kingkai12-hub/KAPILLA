/**
 * Android release gate.
 *
 * `requiredVersion` is the version the website currently serves. The native
 * shell reports the version it was installed with through `@capacitor/app`, and
 * `components/AppUpdateGate.tsx` blocks anything older until the user updates.
 *
 * The gate ships in the web app rather than the APK, so raising this number and
 * deploying is all it takes to force a release on every older install — the
 * already-installed apps pick the change up on their next load.
 *
 * Keep it in step with `versionName` in `android/app/build.gradle` and the APK
 * in `public/downloads/`; a build whose `versionName` was not bumped would be
 * asked to update to itself forever.
 */
export const APP_RELEASE = {
  requiredVersion: '1.0.2',
  downloadPath: '/download',
} as const;

/** Order two dotted version strings, e.g. `1.0.2` against `1.10.0`. */
export function compareAppVersions(a: string, b: string): number {
  const left = String(a ?? '')
    .split('.')
    .map((part) => parseInt(part, 10) || 0);
  const right = String(b ?? '')
    .split('.')
    .map((part) => parseInt(part, 10) || 0);

  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }

  return 0;
}
