-- Add requisitionNumber field to Invoice table
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "requisitionNumber" TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS "Invoice_requisitionNumber_idx" ON "Invoice"("requisitionNumber");
