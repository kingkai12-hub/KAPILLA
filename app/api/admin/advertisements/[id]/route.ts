import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const advertisement = await db.advertisement.findUnique({
      where: { id: params.id },
    });
    if (!advertisement) {
      return NextResponse.json(
        { error: 'Advertisement not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(advertisement);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch advertisement' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const advertisement = await db.advertisement.update({
      where: { id: params.id },
      data: {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
    return NextResponse.json(advertisement);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update advertisement' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.advertisement.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete advertisement' },
      { status: 500 }
    );
  }
}
