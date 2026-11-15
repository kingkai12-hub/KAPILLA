import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  try {
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const base64 = doc.data.split(',').pop() || '';
    const buf = Buffer.from(base64, 'base64');
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': doc.mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(doc.name)}"`,
        // Documents are staff-only, so they must never be cached by shared proxies.
        'Cache-Control': 'private, no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to download' }, { status: 500 });
  }
}
