import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';

const ALLOWED_ROLES = ['ADMIN', 'MD', 'CEO', 'MANAGER', 'OPERATION_MANAGER'];

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  if (!requireRole(auth.user!, ALLOWED_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const advertisement = await db.advertisement.findUnique({ where: { id: params.id } });
    if (!advertisement) {
      return NextResponse.json({ error: 'Advertisement not found' }, { status: 404 });
    }
    return NextResponse.json(advertisement);
  } catch (error) {
    console.error('[AD_GET_ONE]', error);
    return NextResponse.json({ error: 'Failed to fetch advertisement' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  if (!requireRole(auth.user!, ALLOWED_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const data = await req.json();
    if (!data.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    const advertisement = await db.advertisement.update({
      where: { id: params.id },
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        imageUrl: data.imageUrl || null,
        linkUrl: data.linkUrl || null,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
    return NextResponse.json(advertisement);
  } catch (error) {
    console.error('[AD_UPDATE]', error);
    return NextResponse.json({ error: 'Failed to update advertisement' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  if (!requireRole(auth.user!, ALLOWED_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    await db.advertisement.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[AD_DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete advertisement' }, { status: 500 });
  }
}
