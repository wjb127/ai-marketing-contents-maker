-- ULTRA SIMPLE CONTENT SCHEMA
-- Philosophy: LLM will handle everything, so keep it minimal

CREATE TABLE public.contents_simple (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    
    -- Core data (absolutely necessary)
    content TEXT NOT NULL,
    prompt TEXT NOT NULL,  -- All parameters bundled into one text field
    
    -- Simple metadata
    status TEXT DEFAULT 'draft' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Example of what 'prompt' field contains:
-- "Content Type: x_post
-- Topic: AI 마케팅 전략
-- Tone: professional
-- Target Audience: 마케터
-- Additional Instructions: 해시태그 포함, 280자 이내
-- Length: short"

-- Indexes for performance
CREATE INDEX idx_contents_simple_user_id ON public.contents_simple(user_id);
CREATE INDEX idx_contents_simple_status ON public.contents_simple(status);
CREATE INDEX idx_contents_simple_created_at ON public.contents_simple(created_at DESC);

-- RLS policies
ALTER TABLE public.contents_simple ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own simple contents" ON public.contents_simple
    FOR ALL USING (auth.uid() = user_id);