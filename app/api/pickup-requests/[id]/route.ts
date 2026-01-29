import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    const updatedRequest = await db.pickupRequest.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating pickup request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { userId } = body as { userId?: string };

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    const allowedRoles = ['ADMIN', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO'];

    if (!user || !allowedRoles.includes(String(user.role))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const request = await db.pickupRequest.findUnique({ where: { id } });
    if (!request) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    // if (!['ISSUED', 'REJECTED'].includes(String(request.status))) {
    //   return NextResponse.json({ error: 'Only ISSUED or REJECTED can be deleted' }, { status: 400 });
    // }

    await db.pickupRequest.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting pickup request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
