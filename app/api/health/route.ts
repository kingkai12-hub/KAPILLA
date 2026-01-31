import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Minimal DB check; if DB is reachable, this will succeed
    const userCount = await db.user.count();
    return NextResponse.json({
      ok: true,
      db: 'reachable',
      users: userCount
    });
  } catch (error: any) {
    console.error('[HEALTH_CHECK]', error);
    return NextResponse.json({
      ok: false,
      db: 'unreachable',
      error: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}
