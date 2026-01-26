import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    await db.user.update({
      where: { id: userId },
      data: { lastActive: new Date() }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[HEARTBEAT_ERROR]', error);
    return NextResponse.json({ error: 'Failed to update heartbeat' }, { status: 500 });
  }
}
