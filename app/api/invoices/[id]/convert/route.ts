import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Dynamically import db
async function getDb() {
  const { db } = await import('@/lib/db');
  return db;
}

// POST convert proforma to final invoice
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(context.params);
    const db = await getDb();
    const proforma = await db.invoice.findUnique({
      where: { id: params.id },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!proforma) {
      return NextResponse.json({ error: 'Proforma invoice not found' }, { status: 404 });
    }

    if (proforma.type !== 'PROFORMA') {
      return NextResponse.json(
        { error: 'Only proforma invoices can be converted' },
        { status: 400 }
      );
    }

    if (proforma.status !== 'ACCEPTED') {
      return NextResponse.json(
        { error: 'Proforma must be accepted before conversion' },
        { status: 400 }
      );
    }

    // Check if already converted
    const existing = await db.invoice.findFirst({
      where: { proformaInvoiceId: proforma.id },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Proforma already converted to invoice', invoice: existing },
        { status: 400 }
      );
    }

    // Generate final invoice number continuing from last INV with retry mechanism
    let invoiceNumber = '';
    let nextNumber = 79;
    let createAttempts = 0;
    const maxCreateAttempts = 5;
    let finalInvoice;

    while (createAttempts < maxCreateAttempts) {
      const lastInvoice = await db.invoice.findFirst({
        where: { type: 'FINAL', invoiceNumber: { startsWith: 'INV-' } },
        orderBy: { invoiceNumber: 'desc' },
      });

      if (lastInvoice) {
        const match = lastInvoice.invoiceNumber.match(/\d+$/);
        if (match) nextNumber = Math.max(nextNumber, parseInt(match[0], 10) + 1);
      }

      invoiceNumber = `INV-${String(nextNumber + createAttempts).padStart(4, '0')}`;

      try {
        // Create final invoice from proforma
        finalInvoice = await db.invoice.create({
          data: {
            invoiceNumber,
            type: 'FINAL',
            status: 'SENT',
            proformaInvoiceId: proforma.id,
            customerName: proforma.customerName,
            customerEmail: proforma.customerEmail,
            customerPhone: proforma.customerPhone,
            customerAddress: proforma.customerAddress,
            customerTIN: proforma.customerTIN,
            requisitionNumber: proforma.requisitionNumber, // Copy from proforma, can be edited later
            dueDate: proforma.dueDate,
            subtotal: proforma.subtotal,
            taxRate: proforma.taxRate,
            taxAmount: proforma.taxAmount,
            discount: proforma.discount,
            total: proforma.total,
            currency: proforma.currency,
            notes: proforma.notes,
            terms: proforma.terms,
            items: {
              create: proforma.items.map(
                (item: {
                  description: string;
                  quantity: number;
                  unitPrice: number;
                  amount: number;
                  order: number;
                }) => ({
                  description: item.description,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  amount: item.amount,
                  order: item.order,
                })
              ),
            },
          },
          include: {
            items: {
              orderBy: { order: 'asc' },
            },
          },
        });
        break; // Success!
      } catch (createError) {
        createAttempts++;
        // If unique constraint error, retry with incremented number
        if (
          createError &&
          typeof createError === 'object' &&
          'code' in createError &&
          createError.code === 'P2002'
        ) {
          console.log(`[INVOICE_CONVERT] Duplicate INV number ${invoiceNumber}, retrying...`);
          if (createAttempts < maxCreateAttempts) continue;
        }
        throw createError;
      }
    }

    if (!finalInvoice) {
      throw new Error('Failed to create final invoice after multiple attempts');
    }

    return NextResponse.json(finalInvoice);
  } catch (error) {
    console.error('[INVOICE_CONVERT]', error);
    return NextResponse.json({ error: 'Failed to convert invoice' }, { status: 500 });
  }
}
