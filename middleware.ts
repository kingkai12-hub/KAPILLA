import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('kapilla_auth');
  const userId = request.cookies.get('kapilla_uid');
  const isAuthPage = request.nextUrl.pathname.startsWith('/staff');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  
  // Redirect to login if accessing staff pages without auth
  if (isAuthPage && (!authCookie || !userId)) {
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Create response with security headers
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CSRF protection for API routes
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
    '/staff/:path*',
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
