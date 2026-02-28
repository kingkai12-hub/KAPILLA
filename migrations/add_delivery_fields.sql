-- Add delivery tracking fields to Shipment table
-- Migration: add_delivery_fields
-- Date: 2026-02-15

ALTER TABLE "Shipment" 
ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "proofOfDelivery" TEXT;

-- Add comments for documentation
COMMENT ON COLUMN "Shipment"."deliveredAt" IS 'Timestamp when shipment was delivered and picked up';
COMMENT ON COLUMN "Shipment"."proofOfDelivery" IS 'URL or base64 encoded image of proof of delivery document';
