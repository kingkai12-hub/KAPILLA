import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ADMIN_ROLES = ['ADMIN'];

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  if (!requireRole(auth.user!, ADMIN_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, role, bio, imageUrl } = body;

    const executive = await db.executive.update({
      where: { id },
      data: {
        name,
        role,
        bio,
        imageUrl,
      },
    });

    return NextResponse.json(executive);
  } catch (error) {
    console.error('Error updating executive:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  if (!requireRole(auth.user!, ADMIN_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const { id } = await params;
    await db.executive.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Executive deleted' });
  } catch (error) {
    console.error('Error deleting executive:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
