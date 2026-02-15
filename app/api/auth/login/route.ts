import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, migrateToHash } from '@/lib/auth';
import { loginRateLimit, getClientIp } from '@/lib/ratelimit';

export const runtime = 'nodejs';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 8,
};

export async function POST(req: Request) {
  try {
    // Rate limiting
    const ip = getClientIp(req);
    const { success, limit, remaining, reset } = await loginRateLimit.limit(ip);
    
    if (!success) {
      return NextResponse.json(
        { 
          error: 'Too many login attempts. Please try again later.',
          retryAfter: new Date(reset).toISOString()
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          }
        }
      );
    }
    
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email }
    });

    if (!user || !(await verifyPassword(user.password, password))) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (user.isDisabled) {
      return NextResponse.json({ error: 'Account disabled. Contact admin.' }, { status: 403 });
    }

    // One-time migration: if password was plain text, hash it now
    if (!user.password.startsWith('$2')) {
      try {
        await migrateToHash(user.id, password);
      } catch (e) {
        console.error('Password migration failed:', e);
      }
    }

    const { password: _, ...userWithoutPassword } = user;
    const res = NextResponse.json(userWithoutPassword);
    res.cookies.set('kapilla_auth', '1', cookieOptions);
    res.cookies.set('kapilla_uid', user.id, cookieOptions);
    return res;
  } catch (error: any) {
    console.error('[AUTH_LOGIN]', error);
    return NextResponse.json({ 
      error: 'Internal Server Error'
    }, { status: 500 });
  }
}
