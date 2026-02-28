/**
 * ETA API - Estimated Time of Arrival
 * 
 * Inaonyesha muda wa kufika wa gari kwa muda halisi
 * Inacalculate kulingana na:
 * - Current position
 * - Remaining distance
 * - Average speed (city/highway mix)
 */

import { NextResponse } from 'next/server';
import { calculateRealisticETA } from '@/lib/autonomous-tracking';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const waybillNumber = searchParams.get('waybillNumber');

  if (!waybillNumber) {
    return NextResponse.json(
      { error: 'Waybill number is required' },
      { status: 400 }
    );
  }

  try {
    const result = await calculateRealisticETA(waybillNumber);

    if (!result.eta) {
      return NextResponse.json(
        { error: 'Could not calculate ETA' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      waybillNumber,
      eta: result.eta.toISOString(),
      etaFormatted: result.eta.toLocaleString('en-TZ', {
        timeZone: 'Africa/Dar_es_Salaam',
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      remainingDistanceKm: (result.remainingDistance / 1000).toFixed(1),
      estimatedMinutes: result.estimatedMinutes,
      estimatedHours: (result.estimatedMinutes / 60).toFixed(1),
      calculatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[ETA] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
