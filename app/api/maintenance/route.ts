import { NextResponse } from 'next/server';
import { getMaintenanceStatus, setMaintenanceMode } from '@/lib/maintenance';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const status = await getMaintenanceStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('[MAINTENANCE_GET]', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { requireAuth, requireRole } = await import('@/lib/auth');
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  if (!requireRole(auth.user!, ['ADMIN'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { enabled, message } = body as {
      enabled?: boolean;
      message?: string;
    };

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'enabled must be a boolean' },
        { status: 400 }
      );
    }

    const status = await setMaintenanceMode(enabled, message);
    return NextResponse.json(status);
  } catch (error) {
    console.error('[MAINTENANCE_POST]', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
