-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE subscription_plan_type AS ENUM ('free', 'pro', 'premium');
CREATE TYPE subscription_status_type AS ENUM ('active', 'canceled', 'expired', 'trialing');
CREATE TYPE content_type_enum AS ENUM ('thread', 'x_post', 'blog_post', 'youtube_script', 'instagram_reel_script', 'linkedin_post', 'facebook_post');
CREATE TYPE content_tone_enum AS ENUM ('professional', 'casual', 'humorous', 'inspirational', 'educational', 'motivational');
CREATE TYPE content_status_enum AS ENUM ('draft', 'scheduled', 'published', 'archived');
CREATE TYPE schedule_frequency_enum AS ENUM ('daily', 'weekly', 'bi_weekly', 'monthly');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT,
    avatar_url TEXT,
    subscription_plan subscription_plan_type DEFAULT 'free' NOT NULL,
    subscription_status subscription_status_type DEFAULT 'active' NOT NULL,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    toss_customer_id TEXT,
    monthly_content_count INTEGER DEFAULT 0 NOT NULL,
    monthly_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Payments table for tracking transactions
CREATE TABLE public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    toss_payment_key TEXT NOT NULL,
    toss_order_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    plan_type subscription_plan_type NOT NULL,
    status TEXT NOT NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Contents table
CREATE TABLE public.contents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type content_type_enum NOT NULL,
    tone content_tone_enum NOT NULL,
    status content_status_enum DEFAULT 'draft' NOT NULL,
    topic TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}' NOT NULL,
    word_count INTEGER,
    estimated_read_time INTEGER,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    auto_generated BOOLEAN DEFAULT FALSE NOT NULL,
    schedule_id UUID,
    metadata JSONB DEFAULT '{}' NOT NULL,
    -- Evaluation fields
    ai_rating DECIMAL(2,1) CHECK (ai_rating >= 1.0 AND ai_rating <= 5.0),
    ai_feedback TEXT,
    ai_evaluation_criteria JSONB DEFAULT '{}' NOT NULL,
    evaluated_at TIMESTAMP WITH TIME ZONE,
    evaluation_model TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Schedules table
CREATE TABLE public.schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    content_type content_type_enum NOT NULL,
    frequency schedule_frequency_enum NOT NULL,
    time TIME NOT NULL,
    timezone TEXT DEFAULT 'UTC' NOT NULL,
    topics TEXT[] NOT NULL,
    tone content_tone_enum NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    next_run_at TIMESTAMP WITH TIME ZONE,
    last_run_at TIMESTAMP WITH TIME ZONE,
    total_generated INTEGER DEFAULT 0 NOT NULL,
    settings JSONB DEFAULT '{}' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add foreign key constraint for schedule_id in contents
ALTER TABLE public.contents 
ADD CONSTRAINT fk_contents_schedule 
FOREIGN KEY (schedule_id) REFERENCES public.schedules(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_users_subscription_plan ON public.users(subscription_plan);
CREATE INDEX idx_users_subscription_status ON public.users(subscription_status);
CREATE INDEX idx_contents_user_id ON public.contents(user_id);
CREATE INDEX idx_contents_status ON public.contents(status);
CREATE INDEX idx_contents_content_type ON public.contents(content_type);
CREATE INDEX idx_contents_created_at ON public.contents(created_at DESC);
CREATE INDEX idx_schedules_user_id ON public.schedules(user_id);
CREATE INDEX idx_schedules_is_active ON public.schedules(is_active);
CREATE INDEX idx_schedules_next_run_at ON public.schedules(next_run_at) WHERE is_active = TRUE;
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Contents policies
CREATE POLICY "Users can view their own contents" ON public.contents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contents" ON public.contents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contents" ON public.contents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contents" ON public.contents
    FOR DELETE USING (auth.uid() = user_id);

-- Schedules policies
CREATE POLICY "Users can view their own schedules" ON public.schedules
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedules" ON public.schedules
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules" ON public.schedules
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedules" ON public.schedules
    FOR DELETE USING (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

-- Functions for automatic user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to reset monthly content count
CREATE OR REPLACE FUNCTION public.reset_monthly_content_count()
RETURNS void AS $$
BEGIN
    UPDATE public.users 
    SET 
        monthly_content_count = 0,
        monthly_reset_date = NOW()
    WHERE monthly_reset_date <= NOW() - INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user content limits
CREATE OR REPLACE FUNCTION public.check_content_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_plan subscription_plan_type;
    current_count INTEGER;
    max_allowed INTEGER;
BEGIN
    SELECT subscription_plan, monthly_content_count 
    INTO user_plan, current_count
    FROM public.users 
    WHERE id = user_uuid;
    
    -- Set limits based on plan
    CASE user_plan
        WHEN 'free' THEN max_allowed := 10;
        WHEN 'pro' THEN max_allowed := 100;
        WHEN 'premium' THEN max_allowed := -1; -- unlimited
    END CASE;
    
    -- Return true if within limits
    RETURN (max_allowed = -1 OR current_count < max_allowed);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment content count
CREATE OR REPLACE FUNCTION public.increment_content_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users 
    SET 
        monthly_content_count = monthly_content_count + 1,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to increment content count on new content
CREATE TRIGGER on_content_created
    AFTER INSERT ON public.contents
    FOR EACH ROW EXECUTE FUNCTION public.increment_content_count();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update updated_at timestamps
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contents_updated_at 
    BEFORE UPDATE ON public.contents 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at 
    BEFORE UPDATE ON public.schedules 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();