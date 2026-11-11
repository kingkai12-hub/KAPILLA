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
  },
  plugins: {
    SplashScreen: {
      /**
       * Hold the launch splash for a fixed minimum so a cold start reads as one
       * deliberate app opening rather than a blink. The native layer owns the
       * timing, so the branded screen stays up while the remote page is still
       * being fetched — the WebView gap is never visible.
       *
       * launchAutoHide keeps the fallback safe: even if the page never loads,
       * the splash always clears itself.
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
