import { db } from '@/lib/db';
import HomeClient from '@/components/HomeClient';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

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

export default async function TrackingPage() {
  const [services, executives] = await Promise.all([getServices(), getExecutives()]);
  return <HomeClient initialServices={services} initialExecutives={executives} />;
}
