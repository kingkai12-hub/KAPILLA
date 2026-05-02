import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const now = new Date();
    const advertisements = await db.advertisement.findMany({
      where: {
        isActive: true,
        AND: [
          {
            OR: [
              { startDate: null },
              { startDate: { lte: now } }
            ]
          },
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } }
            ]
          }
        ]
      },
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json(advertisements);
  } catch (error) {
    return NextResponse.json([], { status: 200 });
  }
}
