import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  const opts = { httpOnly: true, sameSite: 'strict' as const, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 };
  res.cookies.set('kapilla_auth', '', opts);
  res.cookies.set('kapilla_uid', '', opts);
  return res
}
