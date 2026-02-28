-- Fix for: Function Search Path Mutable (Supabase Lint 0011)
-- Sets the search_path to empty string to prevent malicious search_path manipulation.

CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$;
