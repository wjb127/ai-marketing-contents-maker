-- schedules 테이블에 qstash_message_id 컬럼 추가
ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS qstash_message_id TEXT;

-- 인덱스 추가 (QStash 메시지 ID로 빠른 검색 가능)
CREATE INDEX IF NOT EXISTS idx_schedules_qstash_message_id ON public.schedules(qstash_message_id);

-- 기존 활성 스케줄들은 qstash_message_id가 null이므로 재스케줄링이 필요함을 표시
UPDATE public.schedules 
SET qstash_message_id = NULL 
WHERE is_active = true AND qstash_message_id IS NULL;