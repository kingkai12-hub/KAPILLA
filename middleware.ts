import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const MAINTENANCE_CHECK_TTL_MS = 10_000;
const EXEMPT_PREFIXES = [
  '/api/auth/',
  '/api/maintenance',
  '/api/health',
  '/api/docs',
];

interface CachedStatus {
  enabled: boolean;
  timestamp: number;
}

let cachedStatus: CachedStatus | null = null;

async function isMaintenanceMode(request: NextRequest): Promise<boolean> {
  const now = Date.now();
  if (cachedStatus && now - cachedStatus.timestamp < MAINTENANCE_CHECK_TTL_MS) {
    return cachedStatus.enabled;
  }

  try {
    const url = new URL('/api/maintenance', request.url);
    const res = await fetch(url.toString(), {
      cache: 'no-store',
      headers: { cookie: request.headers.get('cookie') || '' },
    });
    if (res.ok) {
      const data = await res.json();
      cachedStatus = { enabled: data.enabled === true, timestamp: now };
      return cachedStatus.enabled;
    }
  } catch (e) {
    console.error('[MIDDLEWARE] maintenance check failed', e);
  }

  return false;
}

async function isAdminUser(request: NextRequest): Promise<boolean> {
  try {
    const url = new URL('/api/auth/session', request.url);
    const res = await fetch(url.toString(), {
      cache: 'no-store',
      headers: { cookie: request.headers.get('cookie') || '' },
    });
    if (res.ok) {
      const data = await res.json();
      return data?.role === 'ADMIN';
    }
  } catch (e) {
    console.error('[MIDDLEWARE] admin check failed', e);
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const maintenance = await isMaintenanceMode(request);
  if (!maintenance) return NextResponse.next();

  const admin = await isAdminUser(request);
  if (admin) return NextResponse.next();

  const isApi = pathname.startsWith('/api/');
  if (isApi) {
    return NextResponse.json(
      {
        error: 'Service Unavailable',
        message: 'The system is currently under maintenance. Please try again later.',
      },
      { status: 503 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
