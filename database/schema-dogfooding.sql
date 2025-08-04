-- Dogfooding용 간소화된 스키마
-- 인증 없이 사용할 수 있도록 설정

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.contents CASCADE;
DROP TABLE IF EXISTS public.schedules CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create types
CREATE TYPE subscription_plan_type AS ENUM ('free', 'pro', 'premium');
CREATE TYPE subscription_status_type AS ENUM ('active', 'inactive', 'cancelled');
CREATE TYPE content_type AS ENUM ('thread', 'x_post', 'blog_post', 'youtube_script', 'instagram_reel', 'linkedin_post', 'newsletter');
CREATE TYPE content_tone AS ENUM ('professional', 'casual', 'friendly', 'educational', 'humorous', 'inspirational', 'formal');
CREATE TYPE content_status AS ENUM ('draft', 'published', 'scheduled', 'archived');

-- 간소화된 사용자 테이블 (dogfooding용)
CREATE TABLE public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT DEFAULT 'dogfooding@test.com' NOT NULL,
    name TEXT DEFAULT 'Dogfooding User',
    subscription_plan subscription_plan_type DEFAULT 'free' NOT NULL,
    subscription_status subscription_status_type DEFAULT 'active' NOT NULL,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    monthly_content_count INTEGER DEFAULT 0 NOT NULL,
    monthly_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 결제 내역
CREATE TABLE public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    toss_payment_key TEXT,
    toss_order_id TEXT,
    amount INTEGER NOT NULL,
    plan_type subscription_plan_type NOT NULL,
    status TEXT NOT NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 콘텐츠
CREATE TABLE public.contents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type content_type NOT NULL,
    tone content_tone NOT NULL,
    topic TEXT NOT NULL,
    content TEXT NOT NULL,
    target_audience TEXT,
    additional_instructions TEXT,
    status content_status DEFAULT 'draft' NOT NULL,
    schedule_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 스케줄
CREATE TABLE public.schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    content_type content_type NOT NULL,
    content_tone content_tone NOT NULL,
    topic TEXT NOT NULL,
    target_audience TEXT,
    additional_instructions TEXT,
    frequency TEXT NOT NULL,
    time_of_day TIME NOT NULL,
    timezone TEXT DEFAULT 'Asia/Seoul' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_contents_user_id ON public.contents(user_id);
CREATE INDEX idx_contents_status ON public.contents(status);
CREATE INDEX idx_schedules_user_id ON public.schedules(user_id);
CREATE INDEX idx_schedules_is_active ON public.schedules(is_active);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contents_updated_at BEFORE UPDATE ON public.contents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON public.schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 기본 dogfooding 사용자 생성
INSERT INTO public.users (id, email, name, subscription_plan, subscription_status)
VALUES ('00000000-0000-0000-0000-000000000001', 'dogfooding@test.com', 'Dogfooding User', 'premium', 'active')
ON CONFLICT (id) DO NOTHING;

-- RLS 정책 (모든 작업 허용 - dogfooding용)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 모든 작업 허용 정책
CREATE POLICY "Allow all operations" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.contents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.payments FOR ALL USING (true) WITH CHECK (true);

-- 월간 콘텐츠 카운트 리셋 함수
CREATE OR REPLACE FUNCTION reset_monthly_content_count()
RETURNS void AS $$
BEGIN
    UPDATE public.users
    SET monthly_content_count = 0,
        monthly_reset_date = NOW()
    WHERE monthly_reset_date < NOW() - INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql;

-- 구독 만료 체크 함수
CREATE OR REPLACE FUNCTION check_subscription_expiry()
RETURNS void AS $$
BEGIN
    UPDATE public.users
    SET subscription_status = 'inactive',
        subscription_plan = 'free'
    WHERE subscription_end_date < NOW()
        AND subscription_status = 'active'
        AND subscription_plan != 'free';
END;
$$ LANGUAGE plpgsql;