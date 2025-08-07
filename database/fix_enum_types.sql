-- 1. 현재 ENUM 타입들 확인
SELECT '=== Current ENUM types ===' as info;
SELECT 
    t.typname AS enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('content_type', 'content_tone', 'content_status', 'content_type_enum', 'content_tone_enum', 'content_status_enum')
GROUP BY t.typname;

-- 2. contents 테이블의 컬럼들을 TEXT 타입으로 변경
-- ENUM 타입 제약을 제거하고 TEXT로 변경하여 유연성 확보

ALTER TABLE public.contents 
ALTER COLUMN content_type TYPE TEXT USING content_type::TEXT;

ALTER TABLE public.contents 
ALTER COLUMN tone TYPE TEXT USING tone::TEXT;

ALTER TABLE public.contents 
ALTER COLUMN status TYPE TEXT USING status::TEXT;

-- 3. 기본값 재설정
ALTER TABLE public.contents 
ALTER COLUMN content_type SET DEFAULT 'x_post';

ALTER TABLE public.contents 
ALTER COLUMN tone SET DEFAULT 'professional';

ALTER TABLE public.contents 
ALTER COLUMN status SET DEFAULT 'draft';

-- 4. NULL 제약 조건 유지
ALTER TABLE public.contents 
ALTER COLUMN content_type SET NOT NULL;

ALTER TABLE public.contents 
ALTER COLUMN tone SET NOT NULL;

ALTER TABLE public.contents 
ALTER COLUMN status SET NOT NULL;

-- 5. schedules 테이블도 동일하게 처리 (필요한 경우)
-- schedules 테이블 구조 확인
SELECT '=== Schedules table structure ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'schedules' 
AND table_schema = 'public'
AND column_name IN ('content_type', 'tone', 'content_tone', 'frequency')
ORDER BY ordinal_position;

-- schedules 테이블의 ENUM 컬럼들도 TEXT로 변경
DO $$
BEGIN
    -- content_type 컬럼이 ENUM이면 TEXT로 변경
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schedules' 
        AND table_schema = 'public'
        AND column_name = 'content_type'
        AND data_type = 'USER-DEFINED'
    ) THEN
        ALTER TABLE public.schedules 
        ALTER COLUMN content_type TYPE TEXT USING content_type::TEXT;
        RAISE NOTICE 'Changed schedules.content_type to TEXT';
    END IF;
    
    -- tone 또는 content_tone 컬럼 처리
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schedules' 
        AND table_schema = 'public'
        AND column_name = 'tone'
        AND data_type = 'USER-DEFINED'
    ) THEN
        ALTER TABLE public.schedules 
        ALTER COLUMN tone TYPE TEXT USING tone::TEXT;
        RAISE NOTICE 'Changed schedules.tone to TEXT';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schedules' 
        AND table_schema = 'public'
        AND column_name = 'content_tone'
        AND data_type = 'USER-DEFINED'
    ) THEN
        ALTER TABLE public.schedules 
        ALTER COLUMN content_tone TYPE TEXT USING content_tone::TEXT;
        RAISE NOTICE 'Changed schedules.content_tone to TEXT';
    END IF;
    
    -- frequency 컬럼이 ENUM이면 TEXT로 변경
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schedules' 
        AND table_schema = 'public'
        AND column_name = 'frequency'
        AND data_type = 'USER-DEFINED'
    ) THEN
        ALTER TABLE public.schedules 
        ALTER COLUMN frequency TYPE TEXT USING frequency::TEXT;
        RAISE NOTICE 'Changed schedules.frequency to TEXT';
    END IF;
END $$;

-- 6. 최종 구조 확인
SELECT '=== Final contents table structure ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'contents' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. 테스트 INSERT (실제로 작동하는지 확인)
-- 주의: 이것은 테스트 데이터입니다
INSERT INTO public.contents (
    user_id,
    title,
    content,
    content_type,
    tone,
    topic,
    status
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Test Content',
    'This is a test content',
    'x_post',
    'professional',
    'Test Topic',
    'draft'
) 
ON CONFLICT DO NOTHING
RETURNING *;

-- 8. Supabase 캐시 새로고침
NOTIFY pgrst, 'reload schema';

SELECT '=== Conversion completed! ===' as message,
       'ENUM types have been converted to TEXT for flexibility' as note;