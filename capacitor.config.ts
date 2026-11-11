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
  backgroundColor: '#0b1f3a',
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
};

export default config;
