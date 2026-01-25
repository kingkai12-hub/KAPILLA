import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const phone = searchParams.get('phone');

    if (!id && !phone) {
      return NextResponse.json({ error: 'ID or Phone Number required' }, { status: 400 });
    }

    let request;
    if (id) {
      request = await db.pickupRequest.findUnique({
        where: { id }
      });
    } else if (phone) {
      // Find the most recent request for this phone number
      request = await db.pickupRequest.findFirst({
        where: { senderPhone: phone },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (!request) {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json(request);
  } catch (error) {
    console.error('[TRACK_PICKUP_REQUEST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
