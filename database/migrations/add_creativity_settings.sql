-- prompt_templates에 창의성 설정 추가
ALTER TABLE public.prompt_templates
ADD COLUMN IF NOT EXISTS creativity_level TEXT DEFAULT 'balanced',
ADD COLUMN IF NOT EXISTS temperature FLOAT DEFAULT 0.7,
ADD COLUMN IF NOT EXISTS top_p FLOAT DEFAULT 0.9;

-- schedules에도 창의성 설정 추가
ALTER TABLE public.schedules
ADD COLUMN IF NOT EXISTS creativity_level TEXT DEFAULT 'balanced',
ADD COLUMN IF NOT EXISTS temperature FLOAT DEFAULT 0.7,
ADD COLUMN IF NOT EXISTS top_p FLOAT DEFAULT 0.9;