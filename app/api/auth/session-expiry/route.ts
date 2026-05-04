import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('kapilla_auth')?.value;

    if (!authCookie || authCookie !== '1') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const expiresAt = Date.now() + SESSION_DURATION;
    return NextResponse.json({ expiresAt });
  } catch (error) {
    console.error('[SESSION_EXPIRY]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
