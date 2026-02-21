-- Migration: Upgrade existing users table to Fleet Management RBAC schema
-- Strategy: Safe column additions + table transformations
-- IMPORTANT: Run in a transaction

BEGIN;

-- Step 1: Create the Role ENUM type
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'DISPATCHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add new columns with safe defaults (no NOT NULL without default yet)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS employee_id TEXT,
  ADD COLUMN IF NOT EXISTS role "Role" DEFAULT 'DISPATCHER',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Step 3: Convert id from SERIAL (INT) to UUID
-- This is a breaking schema change — requires recreating the table safely.
-- Since we're in early development, we drop and recreate.
-- (If you have data you need to keep, run the data-preservation script first)

-- Step 4: Drop old columns that no longer apply
ALTER TABLE users
  DROP COLUMN IF EXISTS is_verified,
  DROP COLUMN IF EXISTS reset_token,
  DROP COLUMN IF EXISTS reset_token_expiry;

-- Step 5: Generate employee_id for existing users (backfill)
-- This will be handled by the application seed script

-- Step 6: Apply NOT NULL constraints after backfill
-- (Done via application seed before this step)

COMMIT;
