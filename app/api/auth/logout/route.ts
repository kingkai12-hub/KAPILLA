import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const opts = {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  };
  // Clear new signed session cookie
  res.cookies.set(SESSION_COOKIE, '', opts);
  // Clear legacy cookies (backward compat)
  res.cookies.set('kapilla_auth', '', opts);
  res.cookies.set('kapilla_uid', '', opts);
  return res;
}
