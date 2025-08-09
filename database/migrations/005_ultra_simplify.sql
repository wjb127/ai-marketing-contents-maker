-- ULTRA SIMPLIFICATION: Reduce to absolute minimum
-- Philosophy: LLM handles everything, database stores only essentials

-- Step 1: Add the new simple prompt column
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS prompt TEXT;

-- Step 2: Migrate existing data to the new structure
-- Convert existing structured data into a single prompt string
UPDATE public.contents SET prompt = 
  CONCAT(
    'content_type: ', COALESCE(content_type, 'x_post'), E'\n',
    'tone: ', COALESCE(tone, 'casual'), E'\n',
    'topic: ', COALESCE(topic, 'General'), E'\n',
    'status: ', COALESCE(status, 'draft')
  )
WHERE prompt IS NULL;

-- Step 3: Drop all the complex columns we no longer need
ALTER TABLE public.contents DROP COLUMN IF EXISTS content_type;
ALTER TABLE public.contents DROP COLUMN IF EXISTS tone;
ALTER TABLE public.contents DROP COLUMN IF EXISTS topic;
ALTER TABLE public.contents DROP COLUMN IF EXISTS title;
ALTER TABLE public.contents DROP COLUMN IF EXISTS tags;
ALTER TABLE public.contents DROP COLUMN IF EXISTS word_count;
ALTER TABLE public.contents DROP COLUMN IF EXISTS estimated_read_time;
ALTER TABLE public.contents DROP COLUMN IF EXISTS scheduled_at;
ALTER TABLE public.contents DROP COLUMN IF EXISTS published_at;
ALTER TABLE public.contents DROP COLUMN IF EXISTS auto_generated;
ALTER TABLE public.contents DROP COLUMN IF EXISTS schedule_id;
ALTER TABLE public.contents DROP COLUMN IF EXISTS metadata;
ALTER TABLE public.contents DROP COLUMN IF EXISTS ai_rating;
ALTER TABLE public.contents DROP COLUMN IF EXISTS ai_feedback;
ALTER TABLE public.contents DROP COLUMN IF EXISTS ai_evaluation_criteria;
ALTER TABLE public.contents DROP COLUMN IF EXISTS evaluated_at;
ALTER TABLE public.contents DROP COLUMN IF EXISTS evaluation_model;

-- Step 4: Final ultra-simple structure
-- public.contents now has only:
-- - id (UUID, primary key)
-- - user_id (UUID, foreign key)
-- - content (TEXT, the generated content)
-- - prompt (TEXT, all parameters bundled)
-- - status (TEXT, simple status)
-- - created_at (TIMESTAMPTZ)
-- - updated_at (TIMESTAMPTZ)

-- Step 5: Ensure prompt is not null (make it required)
UPDATE public.contents SET prompt = 'content_type: x_post\ntone: casual\ntopic: General' 
WHERE prompt IS NULL OR prompt = '';

ALTER TABLE public.contents ALTER COLUMN prompt SET NOT NULL;

-- Step 6: Clean up indexes (remove unused ones, optimize for simple structure)
DROP INDEX IF EXISTS idx_contents_content_type;
DROP INDEX IF EXISTS idx_contents_tone;
CREATE INDEX IF NOT EXISTS idx_contents_user_status ON public.contents(user_id, status);
CREATE INDEX IF NOT EXISTS idx_contents_created_desc ON public.contents(created_at DESC);

-- Step 7: Add a helpful comment
COMMENT ON TABLE public.contents IS 'Ultra-simplified content storage: LLM handles all complexity, database stores only essentials';
COMMENT ON COLUMN public.contents.prompt IS 'All content parameters bundled as text - LLM will parse this';
COMMENT ON COLUMN public.contents.content IS 'Generated content from LLM';

-- Verification query to check the new structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'contents' AND table_schema = 'public'
-- ORDER BY ordinal_position;