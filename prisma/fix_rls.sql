-- Enable Row Level Security (RLS) for all tables
-- This secures the database by preventing unauthorized access via the Supabase API (PostgREST).
-- The application (Prisma) connects as a privileged user (service_role/postgres) and will continue to work.

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentFolder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Shipment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Trip" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CheckIn" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TrackingEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PickupRequest" ENABLE ROW LEVEL SECURITY;

-- No policies are needed for Prisma if it connects using the standard connection string (postgres/service_role),
-- as these users have the BYPASSRLS attribute.
-- This configuration effectively disables public access to your data via the auto-generated Supabase API,
-- which is the recommended security posture when using Prisma with custom authentication.
