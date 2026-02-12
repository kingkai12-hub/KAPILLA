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
    
    // Only update allowed fields
    const { title, description, imageUrl, icon, sortOrder, isActive } = body;

    const service = await db.serviceShowcase.update({
      where: { id },
      data: {
        title,
        description,
        imageUrl,
        icon,
        sortOrder,
        isActive,
      },
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error('Error updating service:', error);
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
    console.log(`Attempting to delete service with ID: ${id}`);

    // Check if exists first
    const existing = await db.serviceShowcase.findUnique({
      where: { id }
    });

    if (!existing) {
      console.log(`Service with ID ${id} not found`);
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    await db.serviceShowcase.delete({
      where: { id },
    });
    
    console.log(`Successfully deleted service ${id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
