import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Stores the FCM registration token for the signed-in user's device. A token is
 * unique per install, so signing in on the same device again (or as another
 * user) just repoints the existing row.
 */
export async function POST(req: Request) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { token?: string; platform?: string };
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    if (!token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 });
    }

    const platform = body.platform || 'android';
    await db.pushSubscription.upsert({
      where: { token },
      create: { token, userId: session.id, platform },
      update: { userId: session.id, platform },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[PUSH_REGISTER]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
