import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emitTo } from '@/lib/chatBus';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { senderId, receiverId, content, attachment, attachmentType } = body;
    if (!senderId || !receiverId || (!content && !attachment)) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const message = await db.message.create({
      data: {
        senderId,
        receiverId,
        content: content || null,
        attachment: attachment || null,
        attachmentType: attachmentType || null,
      },
    });

    const payload = {
      type: 'message',
      id: message.id,
      senderId,
      receiverId,
      content: message.content,
      createdAt: message.createdAt,
    };
    emitTo(receiverId, payload);

    return NextResponse.json(message);
  } catch (error) {
    console.error('Chat send error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
