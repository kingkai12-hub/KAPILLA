import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function clean(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/** Generate the next free KPL-#### client code, mirroring auto-created clients. */
async function nextClientCode(): Promise<string> {
  let counter = await db.customer.count();
  for (let i = 0; i < 25; i++) {
    counter += 1;
    const code = `KPL-${String(counter).padStart(4, '0')}`;
    const clash = await db.customer.findUnique({ where: { code }, select: { id: true } });
    if (!clash) return code;
  }
  return `KPL-${Date.now().toString().slice(-6)}`;
}

// Register a client manually from the portal.
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();

    const name = clean(body.name);
    const phone = clean(body.phone);
    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Client name and phone number are required' },
        { status: 400 }
      );
    }

    const [code, me] = await Promise.all([
      nextClientCode(),
      db.user.findUnique({ where: { id: auth.user.id }, select: { name: true } }),
    ]);

    const customer = await db.customer.create({
      data: {
        code,
        name,
        phone,
        email: clean(body.email),
        address: clean(body.address),
        contactPerson: clean(body.contactPerson),
        notes: clean(body.notes),
        createdById: auth.user.id,
        createdByName: me?.name ?? null,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('[CUSTOMERS_POST]', error);
    return NextResponse.json({ error: 'Failed to register client' }, { status: 500 });
  }
}
