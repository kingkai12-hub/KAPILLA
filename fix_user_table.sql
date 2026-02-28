-- Run this script in your Supabase SQL Editor to fix the "Failed to create user" error

-- 1. Add 'image' column to User table (required for Profile page)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "image" TEXT;

-- 2. Ensure 'role' column exists and has default value
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'STAFF';

-- 3. Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'User';
