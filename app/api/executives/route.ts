import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const executives = await db.executive.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(executives);
  } catch (error) {
    console.error('Error fetching executives:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
