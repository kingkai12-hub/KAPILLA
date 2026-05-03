import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/session';

export async function GET() {
  try {
    const cookieStore = await cookies();

    // Try new signed session first
    const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
    let userId: string | undefined;

    if (sessionToken) {
      const payload = await verifySessionToken(sessionToken);
      userId = payload?.id;
    }

    // Fall back to legacy cookie
    if (!userId) {
      const legacyAuth = cookieStore.get('kapilla_auth')?.value;
      const legacyUid = cookieStore.get('kapilla_uid')?.value;
      if (legacyAuth === '1' && legacyUid) {
        userId = legacyUid;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        workId: true,
        phoneNumber: true,
        image: true,
        isDisabled: true,
      },
    });

    if (!user || user.isDisabled) {
      return NextResponse.json({ error: 'User not found or disabled' }, { status: 401 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('[AUTH_SESSION]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
