-- Add Invoice and InvoiceItem tables for proforma and final invoices

-- Invoice table
CREATE TABLE IF NOT EXISTS "Invoice" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "invoiceNumber" TEXT NOT NULL UNIQUE,
  "type" TEXT NOT NULL DEFAULT 'PROFORMA', -- PROFORMA or FINAL
  "status" TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, SENT, ACCEPTED, PAID, CANCELLED
  "proformaInvoiceId" TEXT, -- Reference to proforma if this is a final invoice
  
  -- Customer details
  "customerName" TEXT NOT NULL,
  "customerEmail" TEXT,
  "customerPhone" TEXT,
  "customerAddress" TEXT,
  "customerTIN" TEXT, -- Tax Identification Number
  
  -- Invoice details
  "issueDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueDate" TIMESTAMP,
  "validUntil" TIMESTAMP, -- For proforma invoices
  
  -- Amounts
  "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0, -- VAT percentage (e.g., 18)
  "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
  
  -- Additional info
  "currency" TEXT NOT NULL DEFAULT 'TZS',
  "notes" TEXT,
  "terms" TEXT,
  "paymentMethod" TEXT,
  "paidAt" TIMESTAMP,
  
  -- Metadata
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
  "amount" DOUBLE PRECISION NOT NULL DEFAULT 0, -- quantity * unitPrice
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
