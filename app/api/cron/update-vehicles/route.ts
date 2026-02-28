/**
 * CRON JOB: Update All Vehicles
 * 
 * Endpoint hii inaitwa kila dakika na Vercel Cron
 * Inafanya update positions za magari yote automatically
 * 
 * SETUP:
 * 1. Add to vercel.json:
 *    {
 *      "crons": [{
 *        "path": "/api/cron/update-vehicles",
 *        "schedule": "* * * * *"
 *      }]
 *    }
 * 
 * 2. Set environment variable:
 *    CRON_SECRET=your-secret-key
 */

import { NextResponse } from 'next/server';
import { updateAllActiveVehicles } from '@/lib/autonomous-tracking';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds max

export async function GET(req: Request) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[CRON] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Starting vehicle update batch...');
    const startTime = Date.now();

    // Update all vehicles
    const result = await updateAllActiveVehicles();

    const duration = Date.now() - startTime;

    console.log(
      `[CRON] Batch complete in ${duration}ms: ${result.success}/${result.total} updated`
    );

    return NextResponse.json({
      success: true,
      result,
      duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CRON] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(req: Request) {
  return GET(req);
}
