import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiter
// Note: In a distributed serverless environment (like Vercel), this map is per-instance.
// It provides basic protection against rapid-fire attacks on a single container.
const ratelimit = new Map<string, { count: number, startTime: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // Limit each IP to 100 requests per minute for API

export function middleware(request: NextRequest) {
  // 1. RATE LIMITING
  // Apply only to API routes to prevent abuse
  if (request.nextUrl.pathname.startsWith('/api')) {
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
    if (request.nextUrl.pathname.startsWith('/api/auth') && currentWindow.count > 20) {
       return new NextResponse(JSON.stringify({ error: 'Too many login attempts. Please wait.' }), { 
         status: 429,
         headers: { 'Content-Type': 'application/json' }
       });
    }

    // General limit for other API routes
    if (currentWindow.count > MAX_REQUESTS) {
      return new NextResponse(JSON.stringify({ error: 'Rate limit exceeded' }), { 
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  const response = NextResponse.next();

  // 2. SECURITY HEADERS
  // These are redundant with next.config.ts but ensure coverage for all responses handled by middleware
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');

  return response;
}

export const config = {
  matcher: '/api/:path*',
}
