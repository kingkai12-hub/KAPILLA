/**
 * API: Update Single Vehicle Position
 * 
 * Called by client-side tracker to update vehicle position in real-time.
 * This works around Vercel Hobby plan's daily cron limitation.
 */

import { NextResponse } from 'next/server';
import { updateVehiclePosition } from '@/lib/autonomous-tracking';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { waybillNumber } = await req.json();

    if (!waybillNumber) {
      return NextResponse.json(
        { error: 'waybillNumber is required' },
        { status: 400 }
      );
    }

    console.log(`[API] Updating position for ${waybillNumber}`);

    // Get database connection
    const { db } = await import('@/lib/db');
    
    // Find shipment and tracking
    const shipment = await db.shipment.findFirst({
      where: { waybillNumber: { equals: waybillNumber, mode: 'insensitive' } },
      include: { tracking: true },
    });

    if (!shipment || !shipment.tracking) {
      return NextResponse.json(
        { error: 'Shipment or tracking not found' },
        { status: 404 }
      );
    }

    // Update the vehicle position using tracking ID
    const result = await updateVehiclePosition(shipment.tracking.id);

    if (!result) {
      return NextResponse.json(
        { error: 'Update failed' },
        { status: 400 }
      );
    }

    // Get updated tracking data
    const updatedTracking = await db.vehicleTracking.findUnique({
      where: { id: shipment.tracking.id },
    });

    return NextResponse.json({
      success: true,
      position: {
        lat: updatedTracking?.currentLat,
        lng: updatedTracking?.currentLng,
        speed: updatedTracking?.speed,
        heading: updatedTracking?.heading,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Error updating position:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
