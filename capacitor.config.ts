import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Production web app that the native Android shell loads.
 * Override per-environment with CAPACITOR_SERVER_URL if needed.
 */
const SERVER_URL = process.env.CAPACITOR_SERVER_URL || 'https://kapillagroup.vercel.app';

const config: CapacitorConfig = {
  appId: 'com.kapillagroup.app',
  appName: 'Kapilla Group',
  webDir: 'capacitor-web',
  backgroundColor: '#ffffff',
  server: {
    url: SERVER_URL,
    androidScheme: 'https',
    cleartext: false,
    errorPath: 'index.html',
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    /**
     * Marks the WebView as the native shell. The server reads this to serve the
     * app home screen instead of the public website — see `NATIVE_SHELL_UA` in
     * `app/page.tsx`. Changing it requires a native rebuild.
     */
    appendUserAgent: 'KapillaAppShell/1.0',
  },
  plugins: {
    SplashScreen: {
      /**
       * The web app owns the visible launch screen: `components/AppSplash.tsx`
       * (and `app/loading.tsx`) render the animated loading page and dismiss
       * this native splash the moment it is painted, so the static drawable is
       * never what the user watches.
       *
       * launchShowDuration is only the safety net for the case where the page
       * never loads and nothing can call hide() (e.g. the offline error page):
       * it is deliberately generous so a slow network is covered by the native
       * sheet rather than by a bare white WebView. launchAutoHide keeps that
       * fallback safe.
       */
      launchShowDuration: 5000,
      launchAutoHide: true,
      launchFadeOutDuration: 400,
      backgroundColor: '#ffffff',
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
    },
  },
};

export default config;
