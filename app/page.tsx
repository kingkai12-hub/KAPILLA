import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import HomeClient from '@/components/HomeClient';
import WebHomeClient from '@/components/WebHomeClient';

export const metadata: Metadata = {
  title: 'Freight, Transport & Customs Clearing in East Africa',
  description:
    'Kapilla Group transports cargo by road, sea and air across Tanzania, East Africa and 200+ destinations — with customs clearing, forwarding and live waybill tracking.',
  alternates: {
    canonical: 'https://kapilla-logistics.vercel.app',
  },
  openGraph: {
    title: 'Kapilla Group — Freight, Transport & Customs Clearing',
    description:
      'Ship by road, sea and air across East Africa and 200+ destinations, and track every consignment in real time.',
    url: 'https://kapilla-logistics.vercel.app/',
  },
};

/**
 * User-agent token the Android shell appends (see `capacitor.config.ts`).
 *
 * The native app loads this same URL, so the only thing separating the app
 * from the website is the request itself. Detecting it here — rather than in
 * the browser — means the server sends the right page in the first paint and
 * neither experience ever flashes the other's layout.
 */
const NATIVE_SHELL_UA = 'KapillaAppShell';

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

async function getAdvertisements() {
  try {
    const now = new Date();
    return await db.advertisement.findMany({
      where: {
        isActive: true,
        AND: [
          {
            OR: [{ startDate: null }, { startDate: { lte: now } }],
          },
          {
            OR: [{ endDate: null }, { endDate: { gte: now } }],
          },
        ],
      },
      orderBy: { sortOrder: 'asc' },
    });
  } catch {
    return [];
  }
}

export default async function Home() {
  const userAgent = (await headers()).get('user-agent') ?? '';

  // Inside the native shell: the app home screen, no web chrome.
  if (userAgent.includes(NATIVE_SHELL_UA)) {
    const [services, executives] = await Promise.all([getServices(), getExecutives()]);
    return <HomeClient initialServices={services} initialExecutives={executives} />;
  }

  // Plain browser: the full public website.
  const [services, executives, advertisements] = await Promise.all([
    getServices(),
    getExecutives(),
    getAdvertisements(),
  ]);

  return (
    <WebHomeClient
      initialServices={services}
      initialExecutives={executives}
      initialAdvertisements={advertisements}
    />
  );
}
