-- 프롬프트 타입 enum 생성 (기존 ENUM이 없을 경우에만)
DO $$ BEGIN
    CREATE TYPE prompt_type_enum AS ENUM ('auto', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 프롬프트 템플릿 테이블 생성
CREATE TABLE IF NOT EXISTS public.prompt_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    topic TEXT,
    content_type TEXT NOT NULL CHECK (content_type IN ('thread', 'x_post', 'blog_post', 'youtube_script', 'instagram_reel_script', 'linkedin_post', 'facebook_post')),
    tone TEXT NOT NULL CHECK (tone IN ('professional', 'casual', 'humorous', 'inspirational', 'educational', 'motivational')),
    target_audience TEXT,
    additional_instructions TEXT,
    prompt_type TEXT DEFAULT 'auto' NOT NULL CHECK (prompt_type IN ('auto', 'custom')),
    custom_prompt TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 인덱스 생성
CREATE INDEX idx_prompt_templates_user_id ON public.prompt_templates(user_id);
CREATE INDEX idx_prompt_templates_is_active ON public.prompt_templates(is_active);
CREATE INDEX idx_prompt_templates_created_at ON public.prompt_templates(created_at DESC);

-- RLS 정책 활성화
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
CREATE POLICY "Users can view their own prompt templates" ON public.prompt_templates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prompt templates" ON public.prompt_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompt templates" ON public.prompt_templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompt templates" ON public.prompt_templates
    FOR DELETE USING (auth.uid() = user_id);

-- updated_at 트리거 추가
CREATE TRIGGER update_prompt_templates_updated_at 
    BEFORE UPDATE ON public.prompt_templates 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();