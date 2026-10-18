-- Adds the Customer model and links shipments to a real client record.
-- Applied because `prisma db push` does not complete against this database.

CREATE TABLE IF NOT EXISTS "Customer" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "contactPerson" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Customer_code_key" ON "Customer"("code");
CREATE INDEX IF NOT EXISTS "Customer_name_idx" ON "Customer"("name");
CREATE INDEX IF NOT EXISTS "Customer_phone_idx" ON "Customer"("phone");
CREATE INDEX IF NOT EXISTS "Customer_isActive_idx" ON "Customer"("isActive");

ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "customerId" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "clientReference" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "packageCount" INTEGER;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "packagingType" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "serviceType" TEXT;

CREATE INDEX IF NOT EXISTS "Shipment_customerId_createdAt_idx" ON "Shipment"("customerId", "createdAt");
CREATE INDEX IF NOT EXISTS "Shipment_customerId_currentStatus_idx" ON "Shipment"("customerId", "currentStatus");

ALTER TABLE "Shipment" DROP CONSTRAINT IF EXISTS "Shipment_customerId_fkey";
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
