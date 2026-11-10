import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from './db';

const TIMEOUT_MS = 5000;

// Same resilient-query pattern used elsewhere in the portal: a slow or
// unavailable database must never take the page down.
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), timeoutMs)),
  ]);
}

/**
 * Invoice / proforma access is granted per-user by an admin (User.canViewInvoices).
 * Executives and admins always have access so they can manage the permission.
 */
export async function hasInvoiceAccess(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('kapilla_uid')?.value;
    if (!userId) return false;
    const user = await withTimeout(
      db.user.findUnique({
        where: { id: userId },
        select: { role: true, canViewInvoices: true },
      })
    );
    if (!user) return false;
    return ['ADMIN', 'MD', 'CEO'].includes(user.role) || user.canViewInvoices;
  } catch (error) {
    console.error('[INVOICES] access check failed', error);
    return false;
  }
}

/**
 * Route-handler guard. Returns a 403 response when the caller lacks invoice
 * access, or null when the request may proceed.
 */
export async function requireInvoiceAccess(): Promise<NextResponse | null> {
  if (await hasInvoiceAccess()) return null;
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
