-- Fix contents table schema for dogfooding environment
-- 이 쿼리는 contents 테이블에 필요한 모든 컬럼을 추가합니다

-- 1. 현재 테이블 구조 확인 (정보 확인용)
SELECT '=== Current contents table structure ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'contents' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. 필요한 컬럼들 추가
DO $$ 
BEGIN
    -- content_type 컬럼 처리
    -- type 컬럼이 있으면 content_type으로 이름 변경, 없으면 새로 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contents' 
        AND table_schema = 'public'
        AND column_name = 'content_type'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'contents' 
            AND table_schema = 'public'
            AND column_name = 'type'
        ) THEN
            ALTER TABLE public.contents RENAME COLUMN type TO content_type;
            RAISE NOTICE 'Renamed column type to content_type';
        ELSE
            ALTER TABLE public.contents 
            ADD COLUMN content_type TEXT NOT NULL DEFAULT 'x_post';
            RAISE NOTICE 'Added content_type column';
        END IF;
    ELSE
        RAISE NOTICE 'content_type column already exists';
    END IF;
    
    -- tone 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contents' 
        AND table_schema = 'public'
        AND column_name = 'tone'
    ) THEN
        ALTER TABLE public.contents 
        ADD COLUMN tone TEXT NOT NULL DEFAULT 'professional';
        RAISE NOTICE 'Added tone column';
    ELSE
        RAISE NOTICE 'tone column already exists';
    END IF;
    
    -- topic 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contents' 
        AND table_schema = 'public'
        AND column_name = 'topic'
    ) THEN
        ALTER TABLE public.contents 
        ADD COLUMN topic TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Added topic column';
    ELSE
        RAISE NOTICE 'topic column already exists';
    END IF;
    
    -- schedule_id 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contents' 
        AND table_schema = 'public'
        AND column_name = 'schedule_id'
    ) THEN
        ALTER TABLE public.contents 
        ADD COLUMN schedule_id UUID;
        RAISE NOTICE 'Added schedule_id column';
    ELSE
        RAISE NOTICE 'schedule_id column already exists';
    END IF;
    
    -- status 컬럼 추가 (없을 경우)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contents' 
        AND table_schema = 'public'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.contents 
        ADD COLUMN status TEXT NOT NULL DEFAULT 'draft';
        RAISE NOTICE 'Added status column';
    ELSE
        RAISE NOTICE 'status column already exists';
    END IF;
    
    -- title 컬럼 추가 (없을 경우)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contents' 
        AND table_schema = 'public'
        AND column_name = 'title'
    ) THEN
        ALTER TABLE public.contents 
        ADD COLUMN title TEXT NOT NULL DEFAULT 'Untitled';
        RAISE NOTICE 'Added title column';
    ELSE
        RAISE NOTICE 'title column already exists';
    END IF;
    
    -- content 컬럼 추가 (없을 경우)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contents' 
        AND table_schema = 'public'
        AND column_name = 'content'
    ) THEN
        ALTER TABLE public.contents 
        ADD COLUMN content TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Added content column';
    ELSE
        RAISE NOTICE 'content column already exists';
    END IF;
    
    -- user_id 컬럼 추가 (없을 경우)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contents' 
        AND table_schema = 'public'
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.contents 
        ADD COLUMN user_id UUID;
        RAISE NOTICE 'Added user_id column';
    ELSE
        RAISE NOTICE 'user_id column already exists';
    END IF;
    
    -- id 컬럼이 없으면 추가 (Primary Key)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contents' 
        AND table_schema = 'public'
        AND column_name = 'id'
    ) THEN
        ALTER TABLE public.contents 
        ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;
        RAISE NOTICE 'Added id column';
    ELSE
        RAISE NOTICE 'id column already exists';
    END IF;
    
    -- created_at 컬럼 추가 (없을 경우)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contents' 
        AND table_schema = 'public'
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.contents 
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column';
    ELSE
        RAISE NOTICE 'created_at column already exists';
    END IF;
    
    -- updated_at 컬럼 추가 (없을 경우)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contents' 
        AND table_schema = 'public'
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.contents 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    ELSE
        RAISE NOTICE 'updated_at column already exists';
    END IF;
    
END $$;

-- 3. 스케줄 테이블에도 필요한 컬럼 확인 및 추가
DO $$
BEGIN
    -- content_tone 컬럼 추가 (tone의 별칭)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schedules' 
        AND table_schema = 'public'
        AND column_name = 'content_tone'
    ) THEN
        -- tone 컬럼이 있는지 확인
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'schedules' 
            AND table_schema = 'public'
            AND column_name = 'tone'
        ) THEN
            -- tone이 있으면 content_tone으로 이름 변경
            ALTER TABLE public.schedules RENAME COLUMN tone TO content_tone;
            RAISE NOTICE 'Renamed schedules.tone to content_tone';
        ELSE
            -- 둘 다 없으면 content_tone 추가
            ALTER TABLE public.schedules 
            ADD COLUMN content_tone TEXT DEFAULT 'professional';
            RAISE NOTICE 'Added content_tone column to schedules';
        END IF;
    END IF;
    
    -- topic 컬럼 확인 (topics 배열이 있으면 topic 단일 컬럼도 추가)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schedules' 
        AND table_schema = 'public'
        AND column_name = 'topic'
    ) THEN
        ALTER TABLE public.schedules 
        ADD COLUMN topic TEXT DEFAULT '';
        RAISE NOTICE 'Added topic column to schedules';
    END IF;
END $$;

-- 4. 최종 구조 확인
SELECT '=== Final contents table structure ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'contents' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '=== Final schedules table structure ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'schedules' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Supabase 캐시 갱신을 위한 더미 쿼리
SELECT COUNT(*) as total_contents FROM public.contents;
SELECT COUNT(*) as total_schedules FROM public.schedules;

-- 완료 메시지
SELECT '=== Schema fix completed! ===' as message,
       'Please restart your application or clear Supabase cache if needed.' as note;