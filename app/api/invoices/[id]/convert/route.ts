import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function getDb() {
  const { db } = await import('@/lib/db');
  return db;
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(context.params);
    const db = await getDb();

    const proforma = await db.invoice.findUnique({
      where: { id: params.id },
      include: { items: { orderBy: { order: 'asc' } } },
    });

    if (!proforma) {
      return NextResponse.json({ error: 'Proforma invoice not found' }, { status: 404 });
    }

    if (proforma.type !== 'PROFORMA') {
      return NextResponse.json({ error: 'Only proforma invoices can be converted' }, { status: 400 });
    }

    if (proforma.status !== 'ACCEPTED') {
      return NextResponse.json(
        { error: `Proforma must be accepted before conversion. Current status: ${proforma.status}` },
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

    // Generate unique invoice number
    let invoiceNumber = '';
    let finalInvoice = null;

    for (let attempt = 0; attempt < 10; attempt++) {
      const lastInvoice = await db.invoice.findFirst({
        where: { type: 'FINAL', invoiceNumber: { startsWith: 'INV-' } },
        orderBy: { createdAt: 'desc' },
      });

      let nextNumber = 1;
      if (lastInvoice) {
        const match = lastInvoice.invoiceNumber.match(/(\d+)$/);
        if (match) nextNumber = parseInt(match[1], 10) + 1 + attempt;
      } else {
        nextNumber = 1 + attempt;
      }

      invoiceNumber = `INV-${String(nextNumber).padStart(4, '0')}`;

      // Check this number isn't taken
      const taken = await db.invoice.findUnique({ where: { invoiceNumber } });
      if (taken) continue;

      try {
        finalInvoice = await db.invoice.create({
          data: {
            invoiceNumber,
            type: 'FINAL',
            status: 'SENT',
            proformaInvoiceId: proforma.id,
            customerName: proforma.customerName,
            customerEmail: proforma.customerEmail ?? null,
            customerPhone: proforma.customerPhone ?? null,
            customerAddress: proforma.customerAddress ?? null,
            customerTIN: proforma.customerTIN ?? null,
            requisitionNumber: proforma.requisitionNumber ?? null,
            issueDate: new Date(),
            dueDate: proforma.dueDate ?? null,
            subtotal: proforma.subtotal,
            taxRate: proforma.taxRate,
            taxAmount: proforma.taxAmount,
            discount: proforma.discount,
            total: proforma.total,
            currency: proforma.currency,
            notes: proforma.notes ?? null,
            terms: proforma.terms ?? null,
            itemsHeader: proforma.itemsHeader ?? null,
            paymentMethod: proforma.paymentMethod ?? null,
            createdBy: proforma.createdBy ?? null,
            items: {
              create: proforma.items.map((item: {
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
              })),
            },
          },
          include: { items: { orderBy: { order: 'asc' } } },
        });
        break;
      } catch (createError: unknown) {
        const err = createError as { code?: string };
        if (err?.code === 'P2002') continue; // duplicate, retry
        throw createError;
      }
    }

    if (!finalInvoice) {
      return NextResponse.json({ error: 'Could not generate a unique invoice number. Please try again.' }, { status: 500 });
    }

    return NextResponse.json(finalInvoice);
  } catch (error) {
    console.error('[INVOICE_CONVERT]', error);
    return NextResponse.json({
      error: 'Failed to convert invoice',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
