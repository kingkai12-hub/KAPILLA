import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';

export const runtime = 'nodejs';

const ADMIN_ROLES = ['ADMIN'];

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  if (!requireRole(auth.user!, ADMIN_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { name, role, bio, imageUrl } = body;

    const executive = await db.executive.create({
      data: {
        name,
        role,
        bio,
        imageUrl,
      },
    });

    return NextResponse.json(executive);
  } catch (error) {
    console.error('Error creating executive:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
