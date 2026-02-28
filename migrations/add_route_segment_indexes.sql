-- Add critical indexes for RouteSegment table
-- These indexes dramatically improve query performance for tracking operations

-- Index on trackingId (most important - used in every tracking query)
CREATE INDEX IF NOT EXISTS "RouteSegment_trackingId_idx" ON "RouteSegment"("trackingId");

-- Composite index for filtering by trackingId and isCompleted
CREATE INDEX IF NOT EXISTS "RouteSegment_trackingId_isCompleted_idx" ON "RouteSegment"("trackingId", "isCompleted");

-- Composite index for ordering segments by trackingId and order
CREATE INDEX IF NOT EXISTS "RouteSegment_trackingId_order_idx" ON "RouteSegment"("trackingId", "order");

-- Verify indexes were created
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'RouteSegment'
ORDER BY indexname;
