-- Convert all enum columns to TEXT for better flexibility
-- This eliminates the need for schema migrations when adding new content types

-- Step 1: Convert contents table enum columns to TEXT
ALTER TABLE public.contents 
  ALTER COLUMN content_type TYPE TEXT,
  ALTER COLUMN tone TYPE TEXT,
  ALTER COLUMN status TYPE TEXT;

-- Step 2: Convert schedules table enum columns to TEXT  
ALTER TABLE public.schedules
  ALTER COLUMN content_type TYPE TEXT,
  ALTER COLUMN frequency TYPE TEXT,
  ALTER COLUMN tone TYPE TEXT;

-- Step 3: Convert users table enum columns to TEXT
ALTER TABLE public.users
  ALTER COLUMN subscription_plan TYPE TEXT,
  ALTER COLUMN subscription_status TYPE TEXT;

-- Step 4: Convert payments table enum column to TEXT
ALTER TABLE public.payments
  ALTER COLUMN plan_type TYPE TEXT;

-- Step 5: Drop the enum types (this will only work if no other tables use them)
DROP TYPE IF EXISTS content_type_enum CASCADE;
DROP TYPE IF EXISTS content_tone_enum CASCADE; 
DROP TYPE IF EXISTS content_status_enum CASCADE;
DROP TYPE IF EXISTS schedule_frequency_enum CASCADE;
DROP TYPE IF EXISTS subscription_plan_type CASCADE;
DROP TYPE IF EXISTS subscription_status_type CASCADE;