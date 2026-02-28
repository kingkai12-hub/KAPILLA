import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('kapilla_uid')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        workId: true,
        phoneNumber: true,
        image: true,
        isDisabled: true,
      }
    });

    if (!user || user.isDisabled) {
      return NextResponse.json({ error: 'User not found or disabled' }, { status: 401 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('[AUTH_SESSION]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
