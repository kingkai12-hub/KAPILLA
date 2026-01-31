import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, role, bio, imageUrl } = body;

    const executive = await db.executive.create({
      data: {
        name,
        role,
        bio,
        imageUrl,
      },
    });

    return NextResponse.json(executive);
  } catch (error) {
    console.error('Error creating executive:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
