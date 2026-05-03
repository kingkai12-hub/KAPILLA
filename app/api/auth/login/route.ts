import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, migrateToHash } from '@/lib/auth';
import { loginRateLimit, getClientIp } from '@/lib/ratelimit';
import { createSessionToken, SESSION_COOKIE, SESSION_DURATION_SECONDS } from '@/lib/session';

export const runtime = 'nodejs';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_DURATION_SECONDS,
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
          retryAfter: new Date(reset).toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      );
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    if (!db || !db.user) {
      console.error('[AUTH_LOGIN] Database not initialized');
      return NextResponse.json(
        { error: 'Database connection error. Please contact administrator.', code: 'DB_NOT_INITIALIZED' },
        { status: 500 }
      );
    }

    let user;
    try {
      const queryPromise = db.user.findUnique({ where: { email } });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      );
      user = await Promise.race([queryPromise, timeoutPromise]);
    } catch (dbError) {
      console.error('[AUTH_LOGIN] Database query failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection error. Please try again in a moment.', code: 'DB_QUERY_FAILED' },
        { status: 500 }
      );
    }

    if (!user || !(await verifyPassword(user.password, password))) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (user.isDisabled) {
      return NextResponse.json({ error: 'Account disabled. Contact admin.' }, { status: 403 });
    }

    // One-time migration: hash plain-text passwords
    if (!user.password.startsWith('$2')) {
      try {
        await migrateToHash(user.id, password);
      } catch (e) {
        console.error('Password migration failed:', e);
      }
    }

    // Issue signed session token
    const token = await createSessionToken({ id: user.id, role: user.role });

    const { password: _pwd, ...userWithoutPassword } = user;
    const res = NextResponse.json(userWithoutPassword);

    // Set new signed session cookie
    res.cookies.set(SESSION_COOKIE, token, cookieOptions);

    // Clear legacy cookies if present (graceful rotation)
    res.cookies.set('kapilla_auth', '', { ...cookieOptions, maxAge: 0 });
    res.cookies.set('kapilla_uid', '', { ...cookieOptions, maxAge: 0 });

    return res;
  } catch (error) {
    console.error('[AUTH_LOGIN] Unexpected error:', error);
    // Never expose stack traces or internal details in production
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        code: 'UNEXPECTED_ERROR',
        ...(process.env.NODE_ENV === 'development' && {
          details: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
      { status: 500 }
    );
  }
}
