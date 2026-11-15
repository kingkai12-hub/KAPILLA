import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const STAFF_ROLES = ['ADMIN', 'STAFF', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO', 'ACCOUNTANT'];

/**
 * Geocode a place name (village, ward, street…) that is missing from the
 * built-in `locationCoords` dropdown, using OpenStreetMap's Nominatim.
 *
 * Returns up to 5 candidates so staff can pick the right one. When nothing is
 * found the client falls back to letting staff drop a pin on the map.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  if (!requireRole(auth.user!, STAFF_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const q = new URL(req.url).searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=tz&q=` +
    encodeURIComponent(q);

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
      headers: {
        // Nominatim requires an identifying User-Agent.
        'User-Agent': 'KapillaTracking/1.0 (info@kapillagroup.co.tz)',
        'Accept-Language': 'en',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ results: [] }, { status: 502 });
    }

    const data = await res.json();
    const results = (Array.isArray(data) ? data : [])
      .map((item: { lat?: string; lon?: string; display_name?: string }) => ({
        lat: Number(item.lat),
        lng: Number(item.lon),
        displayName: item.display_name || q,
      }))
      .filter(
        (p: { lat: number; lng: number }) => Number.isFinite(p.lat) && Number.isFinite(p.lng)
      );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('[GEOCODE]', error);
    return NextResponse.json({ results: [] }, { status: 502 });
  }
}
