import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiter
// Note: In a distributed serverless environment (like Vercel), this map is per-instance.
// It provides basic protection against rapid-fire attacks on a single container.
const ratelimit = new Map<string, { count: number; startTime: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // Limit each IP to 100 requests per minute for API

const MAINTENANCE_CHECK_TTL_MS = 10_000;
const MAINTENANCE_EXEMPT_PREFIXES = ['/api/auth/', '/api/maintenance', '/api/health', '/api/docs'];

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
    console.error('[PROXY] maintenance check failed', e);
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
    console.error('[PROXY] admin check failed', e);
  }
  return false;
}

export default async function proxy(request: NextRequest) {
  const authCookie = request.cookies.get('kapilla_auth');
  const userId = request.cookies.get('kapilla_uid');
  const pathname = request.nextUrl.pathname;

  // Expose the pathname to server components (used to keep /staff/login
  // reachable while maintenance mode is on).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);
  const isAuthPage = pathname.startsWith('/staff');
  const isApiRoute = pathname.startsWith('/api');
  const isPublicShipmentRoute = pathname.startsWith('/shipments/');

  // 1. RATE LIMITING
  // Apply only to API routes to prevent abuse
  if (isApiRoute) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ip = (request as any).ip || '127.0.0.1';
    const currentWindow = ratelimit.get(ip) || { count: 0, startTime: Date.now() };

    // Reset window if time passed
    if (Date.now() - currentWindow.startTime > WINDOW_MS) {
      currentWindow.count = 1;
      currentWindow.startTime = Date.now();
    } else {
      currentWindow.count++;
    }

    ratelimit.set(ip, currentWindow);

    // Strict limit for Auth routes
    if (request.nextUrl.pathname.startsWith('/api/auth') && currentWindow.count > 100) {
      return new NextResponse(JSON.stringify({ error: 'Too many login attempts. Please wait.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // General limit for other API routes
    if (currentWindow.count > MAX_REQUESTS) {
      return new NextResponse(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // 2. MAINTENANCE MODE CHECK
  // Block non-admin API requests when maintenance is enabled
  const isExempt = MAINTENANCE_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!isExempt) {
    const maintenance = await isMaintenanceMode(request);
    if (maintenance) {
      const admin = await isAdminUser(request);
      if (!admin && isApiRoute) {
        return NextResponse.json(
          {
            error: 'Service Unavailable',
            message: 'The system is currently under maintenance. Please try again later.',
          },
          { status: 503 }
        );
      }
    }
  }

  // 3. REDIRECT PUBLIC SHIPMENT ROUTES TO HOME
  // Any shared links like /shipments/[waybill] should redirect to home page
  if (isPublicShipmentRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    // Preserve waybill as query param for tracking
    const waybill = request.nextUrl.pathname.split('/').pop();
    if (waybill) {
      url.searchParams.set('waybill', waybill);
    }
    return NextResponse.redirect(url);
  }

  // 4. AUTH GUARD FOR STAFF ROUTES
  if (isAuthPage) {
    const isLogin = request.nextUrl.pathname === '/staff/login';

    if (!authCookie?.value || !userId?.value) {
      if (isLogin) {
        return NextResponse.next({ request: { headers: requestHeaders } });
      }
      // Redirect unauthenticated users to home page to avoid confusion
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.search = '';
      return NextResponse.redirect(url);
    } else if (isLogin) {
      // If already logged in, redirect to dashboard
      const url = request.nextUrl.clone();
      url.pathname = '/staff/dashboard';
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  // Create response with security headers
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // 5. SECURITY HEADERS
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // 6. CSRF protection for API routes
  if (isApiRoute && request.method !== 'GET') {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    if (origin && !origin.includes(host || '')) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/staff/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
