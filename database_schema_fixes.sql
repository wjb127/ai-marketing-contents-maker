-- 🔧 데이터베이스 스키마 수정 SQL
-- 누락된 컬럼들을 추가합니다

-- 1. system_prompt_templates 테이블에 variables 컬럼 추가
ALTER TABLE system_prompt_templates 
ADD COLUMN IF NOT EXISTS variables JSONB DEFAULT '{}';

-- 2. contents 테이블에 type 컬럼 추가 (content_type과 중복될 수 있지만 안전하게)
ALTER TABLE contents 
ADD COLUMN IF NOT EXISTS type VARCHAR(50);

-- 3. 기존 데이터가 있다면 content_type을 type으로 복사
UPDATE contents 
SET type = content_type 
WHERE type IS NULL AND content_type IS NOT NULL;

-- 4. 기본 템플릿들의 variables 업데이트
UPDATE system_prompt_templates 
SET variables = '{"topic": "주제", "target_audience": "타겟 독자", "tone": "톤", "additional_instructions": "추가 지시사항"}'
WHERE variables = '{}' OR variables IS NULL;

-- 확인 쿼리
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('system_prompt_templates', 'contents')
  AND column_name IN ('variables', 'type', 'content_type')
ORDER BY table_name, column_name;