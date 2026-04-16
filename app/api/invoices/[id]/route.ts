import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Dynamically import db to ensure it's loaded in serverless
async function getDb() {
  const { db } = await import('@/lib/db');
  return db;
}

// GET single invoice
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both Promise and direct params (Next.js 15+ compatibility)
    const params = await Promise.resolve(context.params);
    console.log('[INVOICE_GET] Fetching invoice with ID:', params.id);

    const db = await getDb();

    // Validate db and invoice model
    if (!db || !db.invoice) {
      console.error('[INVOICE_GET] Database not initialized');
      console.error('[INVOICE_GET] db object:', db);
      return NextResponse.json(
        {
          error: 'Database not initialized',
          details: 'Prisma client not available. Check DATABASE_URL environment variable.',
        },
        { status: 500 }
      );
    }

    const invoice = await db.invoice.findUnique({
      where: { id: params.id },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
        finalInvoices: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!invoice) {
      console.log('[INVOICE_GET] Invoice not found:', params.id);
      // List all invoices to help debug
      const allInvoices = await db.invoice.findMany({
        select: { id: true, invoiceNumber: true },
      });
      console.log('[INVOICE_GET] Available invoices:', allInvoices);
      return NextResponse.json(
        {
          error: 'Invoice not found',
          requestedId: params.id,
          availableInvoices: allInvoices.length,
        },
        { status: 404 }
      );
    }

    console.log('[INVOICE_GET] Invoice found:', invoice.invoiceNumber);
    return NextResponse.json(invoice);
  } catch (error) {
    console.error('[INVOICE_GET] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch invoice',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PATCH update invoice
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(context.params);
    const db = await getDb();
    const body = await req.json();

    // Destructure to separate specific fields and prevent accidental updates of items/relations
    const { status, paymentMethod, paidAt, items: _items, ...updateData } = body;

    const invoice = await db.invoice.findUnique({
      where: { id: params.id },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Helper to parse dates safely
    const parseDate = (dateVal: any) => {
      if (!dateVal) return null;
      const d = new Date(dateVal);
      return isNaN(d.getTime()) ? null : d;
    };

    // Update invoice
    const updated = await db.invoice.update({
      where: { id: params.id },
      data: {
        ...updateData,
        status: status !== undefined ? status : invoice.status,
        paymentMethod: paymentMethod !== undefined ? paymentMethod : invoice.paymentMethod,
        paidAt: paidAt !== undefined ? parseDate(paidAt) : invoice.paidAt,
        dueDate: updateData.dueDate !== undefined ? parseDate(updateData.dueDate) : undefined,
        validUntil:
          updateData.validUntil !== undefined ? parseDate(updateData.validUntil) : undefined,
      },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[INVOICE_PATCH]', error);
    return NextResponse.json(
      {
        error: 'Failed to update invoice status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE invoice
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(context.params);
    const db = await getDb();
    await db.invoice.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[INVOICE_DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}

// PUT update entire invoice (for editing)
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(context.params);
    const db = await getDb();
    const body = await req.json();

    console.log('[INVOICE_PUT] Updating invoice:', params.id);

    const invoice = await db.invoice.findUnique({
      where: { id: params.id },
      include: { items: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Calculate totals
    const subtotal = body.items.reduce(
      (sum: number, item: { amount: number }) => sum + item.amount,
      0
    );
    const taxAmount = (subtotal * (body.taxRate || 0)) / 100;
    const total = subtotal + taxAmount - (body.discount || 0);

    // Helper to parse dates safely
    const parseDate = (dateVal: any) => {
      if (!dateVal) return null;
      const d = new Date(dateVal);
      return isNaN(d.getTime()) ? null : d;
    };

    // Use a transaction to ensure atomic update of items
    const updated = await db.$transaction(async (tx) => {
      // 1. Delete existing items
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: params.id },
      });

      // 2. Update invoice and create new items
      return await tx.invoice.update({
        where: { id: params.id },
        data: {
          type: body.type,
          invoiceNumber: body.invoiceNumber || invoice.invoiceNumber,
          customerName: body.customerName,
          customerEmail: body.customerEmail,
          customerPhone: body.customerPhone,
          customerAddress: body.customerAddress,
          customerTIN: body.customerTIN,
          requisitionNumber: body.requisitionNumber,
          dueDate: parseDate(body.dueDate),
          validUntil: parseDate(body.validUntil),
          taxRate: body.taxRate || 0,
          discount: body.discount || 0,
          currency: body.currency || 'TZS',
          notes: body.notes,
          terms: body.terms,
          subtotal,
          taxAmount,
          total,
          items: {
            create: body.items.map(
              (
                item: { description: string; quantity: number; unitPrice: number; amount: number },
                index: number
              ) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                amount: item.amount,
                order: index,
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
    });

    console.log('[INVOICE_PUT] Invoice updated successfully');
    return NextResponse.json(updated);
  } catch (error) {
    console.error('[INVOICE_PUT]', error);
    return NextResponse.json(
      {
        error: 'Failed to update invoice',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
