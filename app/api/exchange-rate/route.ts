import { NextResponse } from 'next/server';
import { fetchExchangeRate, setManualRate, clearRateCache } from '@/lib/exchange-rates';

export const dynamic = 'force-dynamic';

/**
 * GET /api/exchange-rate
 * Fetch current USD/TZS exchange rate
 */
export async function GET() {
  try {
    const rateData = await fetchExchangeRate();
    return NextResponse.json(rateData);
  } catch (error) {
    console.error('[EXCHANGE_RATE_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch exchange rate' }, { status: 500 });
  }
}

/**
 * POST /api/exchange-rate
 * Set manual exchange rate
 */
export async function POST(req: Request) {
  try {
    const { rate } = await req.json();

    if (!rate || typeof rate !== 'number' || rate <= 0) {
      return NextResponse.json({ error: 'Invalid rate value' }, { status: 400 });
    }

    setManualRate(rate);

    return NextResponse.json({
      success: true,
      rate,
      source: 'manual',
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[EXCHANGE_RATE_POST]', error);
    return NextResponse.json({ error: 'Failed to set manual rate' }, { status: 500 });
  }
}

/**
 * DELETE /api/exchange-rate
 * Clear rate cache (force refresh)
 */
export async function DELETE() {
  try {
    clearRateCache();
    return NextResponse.json({ success: true, message: 'Rate cache cleared' });
  } catch (error) {
    console.error('[EXCHANGE_RATE_DELETE]', error);
    return NextResponse.json({ error: 'Failed to clear rate cache' }, { status: 500 });
  }
}
