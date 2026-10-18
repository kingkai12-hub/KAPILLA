import type { Metadata } from 'next';
import { db } from '@/lib/db';
import HomeClient from '@/components/HomeClient';

export const revalidate = 60;

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
  const [services, executives, advertisements] = await Promise.all([
    getServices(),
    getExecutives(),
    getAdvertisements(),
  ]);

  return (
    <HomeClient
      initialServices={services}
      initialExecutives={executives}
      initialAdvertisements={advertisements}
    />
  );
}
