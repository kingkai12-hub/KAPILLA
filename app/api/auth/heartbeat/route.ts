import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    await db.user.update({
      where: { id: userId },
      data: { lastActive: new Date() }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[AUTH_HEARTBEAT]', error);
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
