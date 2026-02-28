import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Dynamically import db
async function getDb() {
  const { db } = await import('@/lib/db');
  return db;
}

// GET all invoices
export async function GET(req: Request) {
  try {
    console.log('[INVOICES_GET] Fetching invoices...');

    const db = await getDb();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // PROFORMA or FINAL
    const status = searchParams.get('status');

    const where: { type?: string; status?: string } = {};
    if (type) where.type = type;
    if (status) where.status = status;

    // Validate db
    if (!db || !db.invoice) {
      console.error('[INVOICES_GET] Database not initialized');
      return NextResponse.json(
        {
          error: 'Database not initialized',
          details: 'Prisma client not available',
        },
        { status: 500 }
      );
    }

    const invoices = await db.invoice.findMany({
      where,
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('[INVOICES_GET] Found', invoices.length, 'invoices');
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('[INVOICES_GET] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch invoices',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST create new invoice
export async function POST(req: Request) {
  try {
    console.log('[INVOICES_POST] Starting invoice creation...');

    const db = await getDb();
    const body = await req.json();
    console.log('[INVOICES_POST] Request body:', JSON.stringify(body, null, 2));

    const {
      type = 'PROFORMA',
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      customerTIN,
      dueDate,
      validUntil,
      taxRate = 0,
      discount = 0,
      currency = 'TZS',
      notes,
      terms,
      items = [],
    } = body;

    if (!customerName) {
      console.log('[INVOICES_POST] Validation failed: Customer name missing');
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }

    if (!items || items.length === 0) {
      console.log('[INVOICES_POST] Validation failed: No items');
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
    }

    console.log('[INVOICES_POST] Validation passed, generating invoice number...');

    // Generate invoice number
    const prefix = type === 'PROFORMA' ? 'PI' : 'INV';
    const count = await db.invoice.count({ where: { type } });
    const invoiceNumber = `${prefix}-${String(count + 1).padStart(4, '0')}`;

    console.log('[INVOICES_POST] Invoice number:', invoiceNumber);

    // Calculate amounts
    let subtotal = 0;
    const invoiceItems = items.map(
      (item: { description: string; quantity: number; unitPrice: number }, index: number) => {
        const amount = item.quantity * item.unitPrice;
        subtotal += amount;
        return {
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount,
          order: index,
        };
      }
    );

    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount - discount;

    console.log('[INVOICES_POST] Calculated totals:', { subtotal, taxAmount, discount, total });
    console.log('[INVOICES_POST] Creating invoice in database...');

    // Create invoice with items
    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        type,
        status: 'DRAFT',
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        customerTIN,
        dueDate: dueDate ? new Date(dueDate) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        subtotal,
        taxRate,
        taxAmount,
        discount,
        total,
        currency,
        notes,
        terms,
        items: {
          create: invoiceItems,
        },
      },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    console.log('[INVOICES_POST] Invoice created successfully:', invoice.id);
    return NextResponse.json(invoice);
  } catch (error) {
    console.error('[INVOICES_POST] ERROR:', error);
    console.error(
      '[INVOICES_POST] Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );
    return NextResponse.json(
      {
        error: 'Failed to create invoice',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
