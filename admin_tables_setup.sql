-- 🔧 Admin 테이블 설정 SQL 쿼리
-- Supabase SQL Editor에서 실행해주세요

-- 1. 프롬프트 카테고리 테이블 생성
CREATE TABLE IF NOT EXISTS prompt_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 시스템 프롬프트 템플릿 테이블 생성  
CREATE TABLE IF NOT EXISTS system_prompt_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  template TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES prompt_categories(id),
  content_type VARCHAR(50), -- 'x_post', 'blog_post', 'thread' 등
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  tags TEXT[], -- 태그 배열
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID DEFAULT '00000000-0000-0000-0000-000000000001', -- dogfooding user
  
  -- 인덱스
  UNIQUE(name, version)
);

-- 3. 테이블 업데이트 시간 자동 갱신 트리거 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 적용
CREATE TRIGGER update_prompt_categories_updated_at 
  BEFORE UPDATE ON prompt_categories 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_system_prompt_templates_updated_at 
  BEFORE UPDATE ON system_prompt_templates 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 4. 기본 카테고리 데이터 삽입
INSERT INTO prompt_categories (name, description, display_order) VALUES
  ('소셜미디어', 'X(Twitter), Instagram, Facebook 등 소셜미디어 콘텐츠', 1),
  ('블로그', '블로그 포스트 및 아티클 콘텐츠', 2),  
  ('비디오', 'YouTube, 릴 등 비디오 스크립트', 3),
  ('비즈니스', 'LinkedIn, 비즈니스 콘텐츠', 4),
  ('기타', '기타 콘텐츠 유형', 5)
ON CONFLICT (name) DO NOTHING;

-- 5. 기본 프롬프트 템플릿 데이터 삽입
INSERT INTO system_prompt_templates (name, template, description, category_id, content_type, is_default) 
SELECT 
  'X 포스트 기본 템플릿',
  '다음 조건에 맞는 X(Twitter) 포스트를 작성해주세요:

주제: {topic}
타겟 독자: {target_audience}
톤: {tone}
추가 지시사항: {additional_instructions}

요구사항:
- 280자 이내로 작성
- 해시태그 2-3개 포함
- 읽기 쉽고 engaging한 내용
- 한국어로 작성',
  'X(Twitter) 포스트 생성용 기본 템플릿',
  (SELECT id FROM prompt_categories WHERE name = '소셜미디어'),
  'x_post',
  true
WHERE NOT EXISTS (SELECT 1 FROM system_prompt_templates WHERE name = 'X 포스트 기본 템플릿');

INSERT INTO system_prompt_templates (name, template, description, category_id, content_type, is_default)
SELECT
  '블로그 포스트 기본 템플릿', 
  '다음 조건에 맞는 블로그 포스트를 작성해주세요:

주제: {topic}
타겟 독자: {target_audience}
톤: {tone}
추가 지시사항: {additional_instructions}

구조:
1. 매력적인 제목
2. 서론 (문제 제기 또는 호기심 유발)
3. 본론 (3-5개 섹션으로 구분)
4. 결론 및 행동 유도
5. 관련 태그 5개

요구사항:
- 1500-2000자 분량
- 읽기 쉬운 단락 구성
- 구체적인 예시 포함
- 한국어로 작성',
  '블로그 포스트 생성용 기본 템플릿',
  (SELECT id FROM prompt_categories WHERE name = '블로그'),
  'blog_post',
  true
WHERE NOT EXISTS (SELECT 1 FROM system_prompt_templates WHERE name = '블로그 포스트 기본 템플릿');

-- 6. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_prompt_categories_active ON prompt_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_system_prompt_templates_active ON system_prompt_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_system_prompt_templates_content_type ON system_prompt_templates(content_type);
CREATE INDEX IF NOT EXISTS idx_system_prompt_templates_category ON system_prompt_templates(category_id);

-- 7. RLS (Row Level Security) 설정 - 선택사항
-- ALTER TABLE prompt_categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE system_prompt_templates ENABLE ROW LEVEL SECURITY;

-- 완료 확인 쿼리
SELECT 
  'prompt_categories' as table_name,
  COUNT(*) as row_count
FROM prompt_categories
UNION ALL
SELECT 
  'system_prompt_templates' as table_name,
  COUNT(*) as row_count  
FROM system_prompt_templates;