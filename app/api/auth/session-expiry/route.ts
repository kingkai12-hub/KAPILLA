import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours — matches cookie maxAge

export async function GET() {
  try {
    const cookieStore = await cookies();

    // Check new signed session cookie first, then legacy
    const hasSession =
      !!cookieStore.get(SESSION_COOKIE)?.value ||
      cookieStore.get('kapilla_auth')?.value === '1';

    if (!hasSession) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const expiresAt = Date.now() + SESSION_DURATION;
    return NextResponse.json({ expiresAt });
  } catch (error) {
    console.error('[SESSION_EXPIRY]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
