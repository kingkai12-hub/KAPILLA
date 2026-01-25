import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tripId, latitude, longitude, location, status } = body;

    if (!tripId || !latitude || !longitude) {
      return NextResponse.json({ error: 'Missing GPS data' }, { status: 400 });
    }

    // Create CheckIn
    const checkIn = await db.checkIn.create({
      data: {
        tripId,
        latitude,
        longitude,
        location: location || 'Unknown Location',
        status: status || 'OK'
      }
    });

    return NextResponse.json(checkIn, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to check in' }, { status: 500 });
  }
}
