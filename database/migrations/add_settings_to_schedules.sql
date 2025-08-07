-- schedules 테이블에 settings 컬럼 추가
ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}' NOT NULL;

-- topics 배열도 추가 (단일 topic 필드와 함께 사용)
ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS topics TEXT[];

-- time 컬럼도 추가 (time_of_day의 alias)
ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS time TIME;

-- tone 컬럼도 추가 (content_tone의 alias로 사용 가능)
ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS tone TEXT;

-- topics 배열이 비어있으면 topic 필드에서 가져오기
UPDATE public.schedules 
SET topics = ARRAY[topic] 
WHERE topics IS NULL AND topic IS NOT NULL;