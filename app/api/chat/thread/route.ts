import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    // The thread always belongs to the authenticated user, never a client-supplied id.
    const userId = auth.user.id;
    const peerId = searchParams.get('peerId');
    if (!peerId) {
      return NextResponse.json({ error: 'peerId required' }, { status: 400 });
    }

    const messages = await db.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: peerId },
          { senderId: peerId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Chat thread error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
