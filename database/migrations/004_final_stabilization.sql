-- FINAL STABILIZATION: Complete ENUM removal and field simplification
-- This migration ensures 100% stability by eliminating all problematic patterns

-- Step 1: Ensure all ENUM columns are TEXT
ALTER TABLE public.contents 
  ALTER COLUMN content_type TYPE TEXT,
  ALTER COLUMN tone TYPE TEXT,
  ALTER COLUMN status TYPE TEXT;

ALTER TABLE public.schedules
  ALTER COLUMN content_type TYPE TEXT,  
  ALTER COLUMN frequency TYPE TEXT,
  ALTER COLUMN tone TYPE TEXT;

ALTER TABLE public.users
  ALTER COLUMN subscription_plan TYPE TEXT,
  ALTER COLUMN subscription_status TYPE TEXT;

ALTER TABLE public.payments  
  ALTER COLUMN plan_type TYPE TEXT;

-- Step 2: Remove problematic optional columns that cause cache issues
-- NOTE: These will be handled by application logic instead
ALTER TABLE public.contents DROP COLUMN IF EXISTS auto_generated;
ALTER TABLE public.contents DROP COLUMN IF EXISTS word_count;  
ALTER TABLE public.contents DROP COLUMN IF EXISTS estimated_read_time;

-- Step 3: Simplify metadata structure (keep only if absolutely needed)
-- UPDATE public.contents SET metadata = '{}' WHERE metadata IS NULL;

-- Step 4: Drop all ENUM types completely
DROP TYPE IF EXISTS content_type_enum CASCADE;
DROP TYPE IF EXISTS content_tone_enum CASCADE;
DROP TYPE IF EXISTS content_status_enum CASCADE; 
DROP TYPE IF EXISTS schedule_frequency_enum CASCADE;
DROP TYPE IF EXISTS subscription_plan_type CASCADE;
DROP TYPE IF EXISTS subscription_status_type CASCADE;

-- Step 5: Add constraints for data integrity (replace ENUM validation)
ALTER TABLE public.contents ADD CONSTRAINT check_content_type 
  CHECK (content_type IN (
    'thread', 'x_post', 'blog_post', 'youtube_script', 'instagram_reel_script',
    'linkedin_post', 'facebook_post', 'hook_empathy_solution', 'before_after',
    'story_telling', 'listicle', 'hero_journey', 'myth_buster', 'comparison', 
    'emotional_empathy', 'provocative_question', 'fact_bombardment'
  ));

ALTER TABLE public.contents ADD CONSTRAINT check_tone
  CHECK (tone IN ('professional', 'casual', 'humorous', 'inspirational', 'educational', 'motivational'));

ALTER TABLE public.contents ADD CONSTRAINT check_status  
  CHECK (status IN ('draft', 'scheduled', 'published', 'archived'));

-- Step 6: Ensure indexes are optimal for TEXT columns
DROP INDEX IF EXISTS idx_contents_content_type;
DROP INDEX IF EXISTS idx_contents_status;
CREATE INDEX idx_contents_content_type ON public.contents(content_type);
CREATE INDEX idx_contents_status ON public.contents(status);

-- Step 7: Update any existing data to ensure consistency
UPDATE public.contents SET status = 'draft' WHERE status IS NULL OR status = '';
UPDATE public.contents SET content_type = 'x_post' WHERE content_type IS NULL OR content_type = '';
UPDATE public.contents SET tone = 'casual' WHERE tone IS NULL OR tone = '';

COMMENT ON TABLE public.contents IS 'Stabilized content table with TEXT-only fields for maximum flexibility';