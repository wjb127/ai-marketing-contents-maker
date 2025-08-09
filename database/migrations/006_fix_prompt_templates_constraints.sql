-- Fix prompt_templates table content_type constraints to include new content types
-- This addresses the check constraint violation error when creating new prompt templates

-- Drop the old check constraints
ALTER TABLE public.prompt_templates DROP CONSTRAINT IF EXISTS prompt_templates_content_type_check;
ALTER TABLE public.prompt_templates DROP CONSTRAINT IF EXISTS prompt_templates_tone_check;

-- Add new check constraints with all supported content types and tones
ALTER TABLE public.prompt_templates ADD CONSTRAINT prompt_templates_content_type_check 
CHECK (content_type IN (
    'thread', 'x_post', 'blog_post', 'youtube_script', 'instagram_reel_script', 'linkedin_post', 'facebook_post',
    'hook_empathy_solution', 'before_after', 'story_telling', 'listicle', 'hero_journey', 
    'myth_buster', 'comparison', 'emotional_empathy', 'provocative_question', 'fact_bombardment'
));

ALTER TABLE public.prompt_templates ADD CONSTRAINT prompt_templates_tone_check
CHECK (tone IN ('professional', 'casual', 'humorous', 'inspirational', 'educational', 'motivational'));

-- Ensure prompt_type constraint is also properly set
ALTER TABLE public.prompt_templates DROP CONSTRAINT IF EXISTS prompt_templates_prompt_type_check;
ALTER TABLE public.prompt_templates ADD CONSTRAINT prompt_templates_prompt_type_check
CHECK (prompt_type IN ('auto', 'custom'));

-- Grant necessary permissions for the table
GRANT ALL ON public.prompt_templates TO authenticated;
GRANT ALL ON public.prompt_templates TO service_role;