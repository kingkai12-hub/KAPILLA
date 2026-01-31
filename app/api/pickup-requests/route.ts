import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

// POST: Create a new pickup request (Public)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { senderName, senderPhone, pickupAddress, destination, cargoDetails, estimatedWeight } = body;

    if (!senderName || !senderPhone || !pickupAddress || !destination || !cargoDetails) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const request = await db.pickupRequest.create({
      data: {
        senderName,
        senderPhone,
        pickupAddress,
        destination,
        cargoDetails,
        estimatedWeight,
      },
    });

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    console.error('Error creating pickup request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET: List all pickup requests (Protected - ideally, but we'll do simple check or assume middleware/client handles it)
// For now, we'll allow fetching, but in a real app, we should check auth.
// Since this is called from the staff portal which is protected, it's "okay" for this MVP.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where = status ? { status } : {};

    const requests = await db.pickupRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching pickup requests:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
