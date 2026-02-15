import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiter
// Note: In a distributed serverless environment (like Vercel), this map is per-instance.
// It provides basic protection against rapid-fire attacks on a single container.
const ratelimit = new Map<string, { count: number; startTime: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // Limit each IP to 100 requests per minute for API

export default function proxy(request: NextRequest) {
  const authCookie = request.cookies.get('kapilla_auth');
  const userId = request.cookies.get('kapilla_uid');
  const isAuthPage = request.nextUrl.pathname.startsWith('/staff');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');

  // 1. RATE LIMITING
  // Apply only to API routes to prevent abuse
  if (isApiRoute) {
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
      return new NextResponse(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // 2. AUTH GUARD FOR STAFF ROUTES
  if (isAuthPage) {
    const isLogin = request.nextUrl.pathname === '/staff/login';

    if (!authCookie?.value || !userId?.value) {
      if (isLogin) {
        return NextResponse.next();
      }
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    } else if (isLogin) {
      const url = request.nextUrl.clone();
      url.pathname = '/staff/dashboard';
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  // Create response with security headers
  const response = NextResponse.next();

  // 3. SECURITY HEADERS
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // 4. CSRF protection for API routes
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
