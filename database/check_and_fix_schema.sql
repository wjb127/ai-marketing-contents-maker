-- 1. 먼저 현재 contents 테이블 구조 확인
SELECT '=== CURRENT CONTENTS TABLE COLUMNS ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'contents' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. 필요한 경우 테이블을 완전히 재생성 (백업 필요!)
-- 주의: 이 옵션은 기존 데이터를 모두 삭제합니다!
-- 기존 데이터가 중요하다면 실행하지 마세요!

/*
-- 옵션 A: 테이블 재생성 (데이터 손실 주의!)
DROP TABLE IF EXISTS public.contents CASCADE;

CREATE TABLE public.contents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL DEFAULT 'Untitled',
    content TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'x_post',
    tone TEXT NOT NULL DEFAULT 'professional',
    topic TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft',
    schedule_id UUID,
    tags TEXT[] DEFAULT '{}',
    word_count INTEGER,
    estimated_read_time INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_contents_user_id ON public.contents(user_id);
CREATE INDEX idx_contents_status ON public.contents(status);
CREATE INDEX idx_contents_content_type ON public.contents(content_type);
CREATE INDEX idx_contents_schedule_id ON public.contents(schedule_id);
*/

-- 3. 또는 안전하게 컬럼만 추가/수정
-- 이 방법은 기존 데이터를 보존합니다

-- content_type 컬럼 확인 및 추가
DO $$
BEGIN
    -- 먼저 type 컬럼이 있는지 확인
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contents' 
        AND table_schema = 'public'
        AND column_name = 'type'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contents' 
        AND table_schema = 'public'
        AND column_name = 'content_type'
    ) THEN
        -- type을 content_type으로 이름 변경
        ALTER TABLE public.contents RENAME COLUMN type TO content_type;
        RAISE NOTICE 'Renamed type to content_type';
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contents' 
        AND table_schema = 'public'
        AND column_name = 'content_type'
    ) THEN
        -- content_type 컬럼 추가
        ALTER TABLE public.contents ADD COLUMN content_type TEXT NOT NULL DEFAULT 'x_post';
        RAISE NOTICE 'Added content_type column';
    END IF;
    
    -- type 컬럼이 여전히 존재하면 삭제 (content_type과 중복)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contents' 
        AND table_schema = 'public'
        AND column_name = 'type'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contents' 
        AND table_schema = 'public'
        AND column_name = 'content_type'
    ) THEN
        ALTER TABLE public.contents DROP COLUMN type;
        RAISE NOTICE 'Dropped duplicate type column';
    END IF;
END $$;

-- 나머지 필수 컬럼들 추가
DO $$
BEGIN
    -- tone 컬럼
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contents' AND table_schema = 'public' AND column_name = 'tone'
    ) THEN
        ALTER TABLE public.contents ADD COLUMN tone TEXT NOT NULL DEFAULT 'professional';
        RAISE NOTICE 'Added tone column';
    END IF;
    
    -- topic 컬럼
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contents' AND table_schema = 'public' AND column_name = 'topic'
    ) THEN
        ALTER TABLE public.contents ADD COLUMN topic TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Added topic column';
    END IF;
    
    -- schedule_id 컬럼
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contents' AND table_schema = 'public' AND column_name = 'schedule_id'
    ) THEN
        ALTER TABLE public.contents ADD COLUMN schedule_id UUID;
        RAISE NOTICE 'Added schedule_id column';
    END IF;
    
    -- status 컬럼
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contents' AND table_schema = 'public' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.contents ADD COLUMN status TEXT NOT NULL DEFAULT 'draft';
        RAISE NOTICE 'Added status column';
    END IF;
END $$;

-- 4. 최종 구조 다시 확인
SELECT '=== FINAL CONTENTS TABLE COLUMNS ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'contents' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Supabase PostgREST 캐시 새로고침을 위한 시그널
NOTIFY pgrst, 'reload schema';

-- 6. 테스트 쿼리 (실제로 컬럼들이 작동하는지 확인)
SELECT '=== TEST QUERY ===' as info;
SELECT 
    id,
    user_id,
    title,
    content_type,
    tone,
    topic,
    status,
    schedule_id
FROM public.contents
LIMIT 1;

SELECT '=== Schema fix completed! ===' as message;