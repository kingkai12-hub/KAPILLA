import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import HomeClient, { type AppScreen } from '@/components/HomeClient';
import { db } from '@/lib/db';

/**
 * User-agent token the Android shell appends (see `capacitor.config.ts`).
 *
 * The shell loads this same URL, so the only thing separating the app from the
 * website is the request itself.
 */
const NATIVE_SHELL_UA = 'KapillaAppShell';

/** Where a browser visitor lands when they open an app-only route directly. */
const BROWSER_FALLBACK: Record<AppScreen, string> = {
  home: '/',
  track: '/#tracking',
  services: '/#services',
  contact: '/',
};

async function getServices() {
  try {
    return await db.serviceShowcase.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  } catch {
    return [];
  }
}

async function getExecutives() {
  try {
    return await db.executive.findMany({
      orderBy: { createdAt: 'asc' },
    });
  } catch {
    return [];
  }
}

/**
 * Renders one screen of the native app shell.
 *
 * Inside the shell the bottom tab bar is the navigation, and each tab opens a
 * screen of its own. Browsers that reach one of those routes are sent back to
 * the website, where the same content already lives in full.
 */
export default async function AppScreenPage({ screen }: { screen: AppScreen }) {
  const userAgent = (await headers()).get('user-agent') ?? '';

  if (!userAgent.includes(NATIVE_SHELL_UA)) {
    redirect(BROWSER_FALLBACK[screen]);
  }

  const [services, executives] = await Promise.all([getServices(), getExecutives()]);

  return <HomeClient screen={screen} initialServices={services} initialExecutives={executives} />;
}
