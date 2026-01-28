import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const otherUserId = searchParams.get('otherUserId');

  if (!userId || !otherUserId) {
    return NextResponse.json({ error: 'Missing userId or otherUserId' }, { status: 400 });
  }

  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        sender: { select: { name: true, image: true } },
        receiver: { select: { name: true, image: true } },
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { senderId, receiverId, content, attachment, attachmentType } = body;

    if (!senderId || !receiverId || (!content && !attachment)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
        attachment,
        attachmentType,
      },
      include: {
        sender: { select: { name: true, image: true } },
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const messageId = searchParams.get('id');
  const userId = searchParams.get('userId'); // Requesting user ID for verification

  if (!messageId || !userId) {
    return NextResponse.json({ error: 'Missing id or userId' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

    // Allow deletion if user is ADMIN or the sender
    // User requested: "admin can delete any shaired doc"
    if (user.role === 'ADMIN' || message.senderId === userId) {
      await prisma.message.delete({ where: { id: messageId } });
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
