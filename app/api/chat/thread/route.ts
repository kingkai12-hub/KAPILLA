import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const peerId = searchParams.get('peerId');
    if (!userId || !peerId) {
      return NextResponse.json({ error: 'userId and peerId required' }, { status: 400 });
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
