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

    // Update the vehicle position
    const result = await updateVehiclePosition(waybillNumber);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Update failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      position: result.position,
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
