-- Add traffic simulation fields to VehicleTracking table
-- Migration: add_traffic_simulation_fields
-- Date: 2026-02-15

ALTER TABLE "VehicleTracking" 
ADD COLUMN IF NOT EXISTS "isStopped" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "stopUntil" BIGINT,
ADD COLUMN IF NOT EXISTS "stopReason" TEXT,
ADD COLUMN IF NOT EXISTS "speedVariationOffset" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN IF NOT EXISTS "lastVariationUpdate" BIGINT DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN "VehicleTracking"."isStopped" IS 'Whether vehicle is currently stopped (traffic simulation)';
COMMENT ON COLUMN "VehicleTracking"."stopUntil" IS 'Timestamp (ms) when stop will end';
COMMENT ON COLUMN "VehicleTracking"."stopReason" IS 'Reason for stop (e.g., Traffic light, Traffic congestion)';
COMMENT ON COLUMN "VehicleTracking"."speedVariationOffset" IS 'Current speed variation offset (±5 km/h)';
COMMENT ON COLUMN "VehicleTracking"."lastVariationUpdate" IS 'Timestamp (ms) of last variation update';
