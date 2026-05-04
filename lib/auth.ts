import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

const SALT_ROUNDS = 10;
const AUTH_COOKIE = 'kapilla_auth';
const SESSION_USER_ID = 'kapilla_uid';

/** Hash a password for storage */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** Verify password against hash (supports legacy plain-text during migration) */
export async function verifyPassword(stored: string, plain: string): Promise<boolean> {
  if (stored.startsWith('$2')) {
    return bcrypt.compare(plain, stored);
  }
  return stored === plain;
}

/** Migrate plain-text password to hash (one-time upgrade) */
export async function migrateToHash(userId: string, plainPassword: string): Promise<void> {
  const hashed = await hashPassword(plainPassword);
  await db.user.update({
    where: { id: userId },
    data: { password: hashed },
  });
}

/** Get authenticated user from request cookies */
export async function getSession(req: Request): Promise<{ id: string; role: string } | null> {
  try {
    const cookieStore = await cookies();
    const auth = cookieStore.get(AUTH_COOKIE)?.value;
    const userId = cookieStore.get(SESSION_USER_ID)?.value;
    if (!auth || auth !== '1' || !userId) return null;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isDisabled: true },
    });
    if (!user || user.isDisabled) return null;
    return { id: user.id, role: user.role };
  } catch {
    return null;
  }
}

/** Require auth - returns 401 response if not authenticated */
export async function requireAuth(req: Request): Promise<
  | { user: { id: string; role: string }; error: null }
  | { user: null; error: Response }
> {
  const session = await getSession(req);
  if (!session) {
    return {
      user: null,
      error: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }
  return { user: session, error: null };
}

/** Require specific roles */
export function requireRole(user: { role: string }, allowed: string[]): boolean {
  return allowed.includes(user.role);
}
