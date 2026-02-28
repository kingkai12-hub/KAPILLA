import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET is public (used by homepage)
export async function GET() {
  try {
    const services = await db.serviceShowcase.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST requires ADMIN
export async function POST(req: Request) {
  const { requireAuth, requireRole } = await import('@/lib/auth');
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  if (!requireRole(auth.user!, ['ADMIN'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { title, description, imageUrl, icon, sortOrder } = body;

    const service = await db.serviceShowcase.create({
      data: {
        title,
        description,
        imageUrl,
        icon,
        sortOrder: sortOrder || 0,
        isActive: true,
      },
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
