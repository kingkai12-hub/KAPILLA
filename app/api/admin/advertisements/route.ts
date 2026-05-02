import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const advertisements = await db.advertisement.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json(advertisements);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch advertisements' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const advertisement = await db.advertisement.create({
      data: {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
    return NextResponse.json(advertisement);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create advertisement' },
      { status: 500 }
    );
  }
}
