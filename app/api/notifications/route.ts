import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The single feed behind the notification centre and the in-app pop-up.
 * Alerts raised elsewhere (e.g. `notifyArrival`) are written straight to the
 * `Notification` table, so this route only has to read them back and flip the
 * read flag — there is no second source of truth.
 */
export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const requested = Number(searchParams.get('limit'));
  const limit = Number.isFinite(requested) && requested > 0 ? Math.min(requested, 100) : 30;

  try {
    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      db.notification.count({ where: { userId: session.id, isRead: false } }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('[NOTIFICATIONS_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Mark one notification — or the whole inbox — as read. Scoped to the session
 * user so an id from another account cannot be touched.
 */
export async function PATCH(req: Request) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { id?: string; all?: boolean };

    if (body.all) {
      await db.notification.updateMany({
        where: { userId: session.id, isRead: false },
        data: { isRead: true },
      });
    } else if (body.id) {
      await db.notification.updateMany({
        where: { id: body.id, userId: session.id },
        data: { isRead: true },
      });
    } else {
      return NextResponse.json({ error: 'Provide "id" or "all"' }, { status: 400 });
    }

    const unreadCount = await db.notification.count({
      where: { userId: session.id, isRead: false },
    });

    return NextResponse.json({ ok: true, unreadCount });
  } catch (error) {
    console.error('[NOTIFICATIONS_PATCH]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Remove notifications the user no longer needs.
 *
 * - `{ id }`   deletes that alert. A regular user can only delete their own;
 *              an ADMIN may delete any alert (useful for cleaning up noise
 *              that was raised by mistake).
 * - `{ all: true }` empties the caller's own inbox.
 */
export async function DELETE(req: Request) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { id?: string; all?: boolean };

    if (body.all) {
      await db.notification.deleteMany({ where: { userId: session.id } });
    } else if (body.id) {
      const where =
        session.role === 'ADMIN' ? { id: body.id } : { id: body.id, userId: session.id };
      await db.notification.deleteMany({ where });
    } else {
      return NextResponse.json({ error: 'Provide "id" or "all"' }, { status: 400 });
    }

    const unreadCount = await db.notification.count({
      where: { userId: session.id, isRead: false },
    });

    return NextResponse.json({ ok: true, unreadCount });
  } catch (error) {
    console.error('[NOTIFICATIONS_DELETE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
