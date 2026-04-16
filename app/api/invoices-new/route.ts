import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Dynamically import db
async function getDb() {
  const { db } = await import('@/lib/db');
  return db;
}

// GET all invoices
export async function GET(req: Request) {
  const prisma = await getDb();

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const where: Record<string, string> = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('[INVOICES_NEW_GET]', error);
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
  const prisma = await getDb();

  try {
    console.log('[INVOICES_NEW_POST] Starting...');

    const body = await req.json();
    console.log('[INVOICES_NEW_POST] Body received:', JSON.stringify(body, null, 2));

    const {
      type = 'PROFORMA',
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      customerTIN,
      requisitionNumber,
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
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
    }

    console.log('[INVOICES_NEW_POST] Generating invoice number...');

    // Generate unique invoice number with retry mechanism
    const prefix = type === 'PROFORMA' ? 'PI' : 'INV';
    let invoiceNumber = '';
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        const lastInvoice = await prisma.invoice.findFirst({
          where: {
            type,
            invoiceNumber: { startsWith: `${prefix}-` },
          },
          orderBy: { invoiceNumber: 'desc' },
        });

        let nextNumber = 1;
        if (prefix === 'INV') {
          if (lastInvoice) {
            const match = lastInvoice.invoiceNumber.match(/\d+$/);
            if (match) {
              const lastNumber = parseInt(match[0], 10);
              nextNumber = lastNumber + 1;
            } else {
              nextNumber = 79;
            }
          } else {
            nextNumber = 79;
          }
        } else {
          if (lastInvoice) {
            const match = lastInvoice.invoiceNumber.match(/\d+$/);
            if (match) {
              nextNumber = parseInt(match[0], 10) + 1;
            }
          }
        }

        invoiceNumber = `${prefix}-${String(nextNumber).padStart(4, '0')}`;
        console.log('[INVOICES_NEW_POST] Generated invoice number:', invoiceNumber);
        break;
      } catch (error) {
        console.error('[INVOICES_NEW_POST] Error generating invoice number:', error);
        attempts++;
        if (attempts >= maxAttempts) {
          // Fallback to timestamp-based number
          const timestamp = Date.now() % 10000;
          invoiceNumber = `${prefix}-${String(timestamp).padStart(4, '0')}`;
          console.log('[INVOICES_NEW_POST] Using fallback invoice number:', invoiceNumber);
        }
      }
    }

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

    console.log('[INVOICES_NEW_POST] Totals:', { subtotal, taxAmount, discount, total });
    console.log('[INVOICES_NEW_POST] Creating invoice...');

    // Helper to parse dates safely
    const parseDate = (dateVal: any) => {
      if (!dateVal) return null;
      const d = new Date(dateVal);
      return isNaN(d.getTime()) ? null : d;
    };

    // Validate Prisma client has invoice model
    if (!prisma || !prisma.invoice || typeof prisma.invoice.create !== 'function') {
      console.error('[INVOICES_NEW_POST] Prisma invoice model not available');
      console.error('[INVOICES_NEW_POST] Prisma object:', prisma);
      console.error('[INVOICES_NEW_POST] Invoice model:', prisma?.invoice);
      return NextResponse.json(
        {
          error: 'Database not properly initialized',
          details: 'Invoice model not available. Please check Prisma configuration.',
        },
        { status: 500 }
      );
    }

    // Create invoice with retry on duplicate
    let invoice;
    let createAttempts = 0;
    const maxCreateAttempts = 3;

    while (createAttempts < maxCreateAttempts) {
      try {
        invoice = await prisma.invoice.create({
          data: {
            invoiceNumber,
            type,
            status: 'DRAFT',
            customerName,
            customerEmail: customerEmail || null,
            customerPhone: customerPhone || null,
            customerAddress: customerAddress || null,
            customerTIN: customerTIN || null,
            requisitionNumber: requisitionNumber || null,
            dueDate: parseDate(dueDate),
            validUntil: parseDate(validUntil),
            subtotal,
            taxRate,
            taxAmount,
            discount,
            total,
            currency,
            notes: notes || null,
            terms: terms || null,
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
        break; // Success, exit loop
      } catch (createError: unknown) {
        createAttempts++;

        // Check if it's a unique constraint error
        if (
          createError &&
          typeof createError === 'object' &&
          'code' in createError &&
          createError.code === 'P2002'
        ) {
          console.log(
            `[INVOICES_NEW_POST] Duplicate invoice number, attempt ${createAttempts}/${maxCreateAttempts}`
          );

          if (createAttempts < maxCreateAttempts) {
            // Regenerate invoice number and try again
            const timestamp = Date.now() % 10000;
            invoiceNumber = `${prefix}-${String(timestamp).padStart(4, '0')}`;
            console.log('[INVOICES_NEW_POST] Retrying with new invoice number:', invoiceNumber);
            continue;
          }
        }

        // If not a duplicate error or max attempts reached, throw
        throw createError;
      }
    }

    console.log('[INVOICES_NEW_POST] Success! Invoice ID:', invoice.id);
    return NextResponse.json(invoice);
  } catch (error) {
    console.error('[INVOICES_NEW_POST] ERROR:', error);
    console.error('[INVOICES_NEW_POST] Stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      {
        error: 'Failed to create invoice',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
