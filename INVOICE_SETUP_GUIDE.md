# Invoice System Setup Guide

## Quick Setup (3 Steps)

### Step 1: Update Prisma Schema
The schema has already been updated with Invoice and InvoiceItem models.

### Step 2: Generate Prisma Client
Run this command to generate the updated Prisma client:

```bash
cd kapilla-logistics
npx prisma generate
```

### Step 3: Run Database Migration
Apply the migration to create invoice tables:

```bash
npx prisma db push
```

Or if you prefer migrations:

```bash
npx prisma migrate dev --name add_invoices
```

## Verification

### Check Tables Created
Run this to open Prisma Studio and verify tables:

```bash
npx prisma studio
```

You should see:
- Invoice table
- InvoiceItem table

### Test the System

1. **Access Invoices**
   - Go to http://localhost:3000/staff/invoices
   - You should see the invoices page

2. **Create Test Invoice**
   - Click "Create Invoice"
   - Fill in customer details
   - Add items
   - Watch calculations update automatically
   - Click "Create Proforma Invoice"

3. **View Invoice**
   - Click "View" on the created invoice
   - Click "Print" to see print layout
   - Click "Accept" to change status
   - Click "Convert to Invoice" to create final invoice

## Troubleshooting

### Error: "Table Invoice does not exist"
**Solution**: Run `npx prisma db push` to create tables

### Error: "Cannot find module '@prisma/client'"
**Solution**: Run `npx prisma generate` to generate client

### Error: "Database connection failed"
**Solution**: Check your DATABASE_URL in .env file

### Navigation Menu Not Showing "Invoices"
**Solution**: 
1. Restart the development server
2. Clear browser cache
3. Check that you're logged in as ADMIN or STAFF

## Database Migration SQL

If you prefer to run SQL directly, here's the migration:

```sql
-- Invoice table
CREATE TABLE IF NOT EXISTS "Invoice" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "invoiceNumber" TEXT NOT NULL UNIQUE,
  "type" TEXT NOT NULL DEFAULT 'PROFORMA',
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "proformaInvoiceId" TEXT,
  "customerName" TEXT NOT NULL,
  "customerEmail" TEXT,
  "customerPhone" TEXT,
  "customerAddress" TEXT,
  "customerTIN" TEXT,
  "issueDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueDate" TIMESTAMP,
  "validUntil" TIMESTAMP,
  "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'TZS',
  "notes" TEXT,
  "terms" TEXT,
  "paymentMethod" TEXT,
  "paidAt" TIMESTAMP,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Invoice items table
CREATE TABLE IF NOT EXISTS "InvoiceItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "invoiceId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS "Invoice_type_idx" ON "Invoice"("type");
CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX IF NOT EXISTS "Invoice_customerName_idx" ON "Invoice"("customerName");
CREATE INDEX IF NOT EXISTS "Invoice_issueDate_idx" ON "Invoice"("issueDate");
CREATE INDEX IF NOT EXISTS "Invoice_proformaInvoiceId_idx" ON "Invoice"("proformaInvoiceId");
CREATE INDEX IF NOT EXISTS "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");
```

## What's Included

### Pages Created
1. `/staff/invoices` - Invoice list page
2. `/staff/invoices/create` - Create invoice form
3. `/staff/invoices/[id]` - Invoice detail & print page

### API Routes Created
1. `GET /api/invoices` - List invoices
2. `POST /api/invoices` - Create invoice
3. `GET /api/invoices/[id]` - Get invoice
4. `PATCH /api/invoices/[id]` - Update invoice
5. `DELETE /api/invoices/[id]` - Delete invoice
6. `POST /api/invoices/[id]/convert` - Convert proforma to final

### Features
- ✅ Proforma invoices
- ✅ Final invoices
- ✅ Automatic calculations (Qty × Price = Amount)
- ✅ VAT calculation (18% default)
- ✅ Discount support
- ✅ Grand total calculation
- ✅ TZS currency formatting
- ✅ Professional print layout
- ✅ Status tracking
- ✅ Convert proforma to final invoice
- ✅ Invoice numbering (PI-XXXX, INV-XXXX)

## Next Steps

After setup is complete:

1. **Test Create Invoice**
   - Create a test proforma invoice
   - Verify calculations work
   - Test print layout

2. **Test Workflow**
   - Create proforma
   - Accept proforma
   - Convert to final invoice
   - Verify both invoices exist

3. **Customize**
   - Update company details in invoice print page
   - Adjust VAT rate if needed
   - Modify terms and conditions

4. **Train Staff**
   - Show staff how to create invoices
   - Explain proforma vs final invoice
   - Demonstrate conversion process

## Support

If you encounter any issues:
1. Check the console for error messages
2. Verify database connection
3. Ensure Prisma client is generated
4. Check that migrations ran successfully

## Status

✅ Invoice system ready to use after running migrations!
