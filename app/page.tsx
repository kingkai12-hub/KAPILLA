import { db } from '@/lib/db';
import HomeClient from '@/components/HomeClient';

export const revalidate = 60;

async function getServices() {
  try {
    return await db.serviceShowcase.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  } catch (error) {
    return [];
  }
}

async function getExecutives() {
  try {
    return await db.executive.findMany({
      orderBy: { createdAt: 'asc' },
    });
  } catch (error) {
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
            OR: [
              { startDate: null },
              { startDate: { lte: now } }
            ]
          },
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } }
            ]
          }
        ]
      },
      orderBy: { sortOrder: 'asc' },
    });
  } catch (error) {
    return [];
  }
}

export default async function Home() {
  const [services, executives, advertisements] = await Promise.all([
    getServices(),
    getExecutives(),
    getAdvertisements(),
  ]);

  return <HomeClient initialServices={services} initialExecutives={executives} initialAdvertisements={advertisements} />;
}
