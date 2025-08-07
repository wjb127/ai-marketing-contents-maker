-- 프롬프트 템플릿 버전 관리 시스템
-- 서비스에서 사용하는 모든 콘텐츠 생성 프롬프트를 관리

-- 1. 프롬프트 템플릿 카테고리 테이블
CREATE TABLE IF NOT EXISTS public.prompt_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 시스템 프롬프트 템플릿 테이블 (버전 관리)
CREATE TABLE IF NOT EXISTS public.system_prompt_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES public.prompt_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- 예: "x_post_generation", "blog_post_generation"
    title TEXT NOT NULL, -- 사용자에게 보여줄 제목
    description TEXT, -- 프롬프트 설명
    template TEXT NOT NULL, -- 실제 프롬프트 템플릿 (변수 포함)
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT true, -- 현재 활성 버전인지
    variables JSONB DEFAULT '[]', -- 프롬프트에 사용되는 변수 목록
    performance_metrics JSONB DEFAULT '{}', -- 성과 지표 (평점, 사용 횟수 등)
    change_notes TEXT, -- 버전 변경 사항
    created_by TEXT DEFAULT 'system', -- 생성자 (admin, system 등)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 같은 name에 대해서는 하나의 버전만 active일 수 있음
    CONSTRAINT unique_active_template UNIQUE (name, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- 3. 프롬프트 사용 이력 테이블 (성과 추적)
CREATE TABLE IF NOT EXISTS public.prompt_usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES public.system_prompt_templates(id) ON DELETE CASCADE,
    template_version INTEGER NOT NULL,
    template_name TEXT NOT NULL,
    content_id UUID, -- 생성된 콘텐츠 ID (있는 경우)
    user_id UUID, -- 사용한 유저 ID (있는 경우)
    input_variables JSONB DEFAULT '{}', -- 사용된 입력 변수들
    generated_content_length INTEGER,
    execution_time_ms INTEGER, -- 실행 시간
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    ai_rating DECIMAL(2,1), -- AI 평가 점수 (있는 경우)
    user_feedback INTEGER, -- 사용자 피드백 (1-5)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 초기 카테고리 데이터 삽입
INSERT INTO public.prompt_categories (name, description, display_order) VALUES
('content_generation', '콘텐츠 생성용 프롬프트', 1),
('content_evaluation', '콘텐츠 평가용 프롬프트', 2),
('content_improvement', '콘텐츠 개선용 프롬프트', 3),
('content_analysis', '콘텐츠 분석용 프롬프트', 4)
ON CONFLICT (name) DO NOTHING;

-- 5. 기본 프롬프트 템플릿들 삽입
-- X Post 생성 프롬프트
INSERT INTO public.system_prompt_templates (
    category_id, name, title, description, template, variables, change_notes, created_by
) VALUES (
    (SELECT id FROM public.prompt_categories WHERE name = 'content_generation'),
    'x_post_generation',
    'X(Twitter) 포스트 생성',
    'X(Twitter) 플랫폼에 최적화된 짧고 임팩트 있는 포스트 생성',
    '당신은 전문적인 소셜미디어 콘텐츠 크리에이터입니다. 다음 조건에 맞는 X(Twitter) 포스트를 작성해주세요.

주제: {{topic}}
톤앤매너: {{tone}}
타겟 오디언스: {{target_audience}}
추가 지시사항: {{additional_instructions}}

작성 가이드라인:
1. 280자 이내로 작성
2. 명확하고 직관적인 메시지
3. {{tone}} 톤에 맞는 표현 사용
4. 필요시 관련 해시태그 2-3개 포함
5. 행동을 유도하는 CTA 포함 고려

창의적이고 참여도가 높은 콘텐츠를 만들어주세요.',
    '["topic", "tone", "target_audience", "additional_instructions"]',
    '최초 버전 - 기본 X 포스트 생성 템플릿',
    'system'
) ON CONFLICT DO NOTHING;

-- Blog Post 생성 프롬프트
INSERT INTO public.system_prompt_templates (
    category_id, name, title, description, template, variables, change_notes, created_by
) VALUES (
    (SELECT id FROM public.prompt_categories WHERE name = 'content_generation'),
    'blog_post_generation',
    '블로그 포스트 생성',
    '구조화되고 SEO에 최적화된 블로그 포스트 생성',
    '당신은 전문적인 콘텐츠 마케터이자 블로거입니다. 다음 조건에 맞는 블로그 포스트를 작성해주세요.

주제: {{topic}}
톤앤매너: {{tone}}
타겟 오디언스: {{target_audience}}
추가 지시사항: {{additional_instructions}}

작성 가이드라인:
1. 매력적인 제목과 서론으로 시작
2. 명확한 구조 (헤딩 사용)
3. {{tone}} 톤에 맞는 문체
4. 실용적이고 가치 있는 정보 제공
5. 자연스러운 키워드 포함 (SEO 고려)
6. 마무리에 핵심 포인트 요약
7. 1000-1500자 분량

독자에게 실질적인 도움이 되는 고품질 콘텐츠를 작성해주세요.',
    '["topic", "tone", "target_audience", "additional_instructions"]',
    '최초 버전 - 기본 블로그 포스트 생성 템플릿',
    'system'
) ON CONFLICT DO NOTHING;

-- LinkedIn Post 생성 프롬프트
INSERT INTO public.system_prompt_templates (
    category_id, name, title, description, template, variables, change_notes, created_by
) VALUES (
    (SELECT id FROM public.prompt_categories WHERE name = 'content_generation'),
    'linkedin_post_generation',
    'LinkedIn 포스트 생성',
    '전문적이고 네트워킹에 적합한 LinkedIn 포스트 생성',
    '당신은 전문적인 비즈니스 콘텐츠 크리에이터입니다. 다음 조건에 맞는 LinkedIn 포스트를 작성해주세요.

주제: {{topic}}
톤앤매너: {{tone}}
타겟 오디언스: {{target_audience}}
추가 지시사항: {{additional_instructions}}

작성 가이드라인:
1. 전문적이고 신뢰할 수 있는 톤
2. 비즈니스 가치나 인사이트 제공
3. 개인적 경험이나 사례 포함
4. 토론을 유도하는 질문 포함
5. 적절한 비즈니스 해시태그 활용
6. 1300자 이내 작성
7. 단락을 나누어 가독성 향상

전문성과 인간미를 모두 보여주는 콘텐츠를 작성해주세요.',
    '["topic", "tone", "target_audience", "additional_instructions"]',
    '최초 버전 - 기본 LinkedIn 포스트 생성 템플릿',
    'system'
) ON CONFLICT DO NOTHING;

-- Thread 생성 프롬프트
INSERT INTO public.system_prompt_templates (
    category_id, name, title, description, template, variables, change_notes, created_by
) VALUES (
    (SELECT id FROM public.prompt_categories WHERE name = 'content_generation'),
    'thread_generation',
    'Thread(연속 트윗) 생성',
    '정보가 풍부한 연속 트윗(Thread) 생성',
    '당신은 전문적인 소셜미디어 콘텐츠 크리에이터입니다. 다음 조건에 맞는 Thread(연속 트윗)를 작성해주세요.

주제: {{topic}}
톤앤매너: {{tone}}
타겟 오디언스: {{target_audience}}
추가 지시사항: {{additional_instructions}}

작성 가이드라인:
1. 첫 번째 트윗은 hook 역할 (흥미 유발)
2. 각 트윗은 280자 이내
3. 5-8개의 연속된 트윗으로 구성
4. 논리적 순서로 정보 전달
5. 각 트윗 끝에 번호 표시 (1/8, 2/8...)
6. 마지막 트윗에는 요약이나 CTA 포함
7. {{tone}} 톤에 맞는 일관된 문체

교육적이면서 참여도 높은 thread를 작성해주세요.',
    '["topic", "tone", "target_audience", "additional_instructions"]',
    '최초 버전 - 기본 Thread 생성 템플릿',
    'system'
) ON CONFLICT DO NOTHING;

-- 콘텐츠 평가 프롬프트
INSERT INTO public.system_prompt_templates (
    category_id, name, title, description, template, variables, change_notes, created_by
) VALUES (
    (SELECT id FROM public.prompt_categories WHERE name = 'content_evaluation'),
    'content_evaluation',
    '콘텐츠 평가',
    '생성된 콘텐츠의 품질을 다각도로 평가',
    '당신은 전문적인 콘텐츠 평가 전문가입니다. 다음 콘텐츠를 평가해주세요.

콘텐츠 타입: {{content_type}}
콘텐츠 내용: {{content}}
원래 주제: {{topic}}
의도된 톤: {{tone}}

다음 6가지 기준으로 1-5점 척도로 평가하고 총 평점과 구체적인 피드백을 제공해주세요:

1. 관련성 (Relevance): 주제와 얼마나 관련이 있는가?
2. 품질 (Quality): 전반적인 콘텐츠 품질은?
3. 참여도 (Engagement): 독자의 관심을 끌 수 있는가?
4. 창의성 (Creativity): 독창적이고 흥미로운가?
5. 명확성 (Clarity): 이해하기 쉽고 명확한가?
6. 톤 정확성 (Tone Accuracy): 의도한 톤과 일치하는가?

응답 형식:
{
  "rating": 전체평점(1-5),
  "criteria": {
    "relevance": 점수,
    "quality": 점수,
    "engagement": 점수,
    "creativity": 점수,
    "clarity": 점수,
    "tone_accuracy": 점수
  },
  "feedback": "구체적인 피드백과 개선사항"
}',
    '["content_type", "content", "topic", "tone"]',
    '최초 버전 - 기본 콘텐츠 평가 템플릿',
    'system'
) ON CONFLICT DO NOTHING;

-- 6. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_system_prompt_templates_name_active ON public.system_prompt_templates(name, is_active);
CREATE INDEX IF NOT EXISTS idx_system_prompt_templates_category ON public.system_prompt_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_system_prompt_templates_version ON public.system_prompt_templates(name, version DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_usage_logs_template ON public.prompt_usage_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_prompt_usage_logs_created_at ON public.prompt_usage_logs(created_at DESC);

-- 7. RLS (Row Level Security) 정책 설정
ALTER TABLE public.prompt_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_usage_logs ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능 (카테고리)
CREATE POLICY "Allow read access to all users" ON public.prompt_categories
FOR SELECT USING (true);

-- 모든 사용자가 활성 템플릿 읽기 가능
CREATE POLICY "Allow read access to active templates" ON public.system_prompt_templates
FOR SELECT USING (is_active = true);

-- 관리자만 템플릿 수정 가능 (추후 관리자 시스템 구축 시)
-- CREATE POLICY "Allow admin full access" ON public.system_prompt_templates
-- FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 모든 사용자가 사용 로그 생성 가능
CREATE POLICY "Allow insert usage logs" ON public.prompt_usage_logs
FOR INSERT WITH CHECK (true);

-- 8. 트리거 함수 - 새 버전 활성화 시 이전 버전 비활성화
CREATE OR REPLACE FUNCTION activate_new_template_version()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active = true THEN
        -- 같은 name의 다른 버전들을 비활성화
        UPDATE public.system_prompt_templates 
        SET is_active = false, updated_at = NOW()
        WHERE name = NEW.name AND id != NEW.id AND is_active = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_activate_new_template_version ON public.system_prompt_templates;
CREATE TRIGGER trigger_activate_new_template_version
    BEFORE INSERT OR UPDATE ON public.system_prompt_templates
    FOR EACH ROW
    EXECUTE FUNCTION activate_new_template_version();

-- 9. 유용한 뷰 생성
-- 활성 템플릿 뷰
CREATE OR REPLACE VIEW active_prompt_templates AS
SELECT 
    spt.*,
    pc.name as category_name,
    pc.description as category_description
FROM public.system_prompt_templates spt
JOIN public.prompt_categories pc ON spt.category_id = pc.id
WHERE spt.is_active = true AND pc.is_active = true
ORDER BY pc.display_order, spt.name;

-- 템플릿 사용 통계 뷰
CREATE OR REPLACE VIEW prompt_usage_stats AS
SELECT 
    spt.name,
    spt.title,
    spt.version,
    COUNT(pul.id) as usage_count,
    AVG(pul.ai_rating) as avg_ai_rating,
    AVG(pul.user_feedback) as avg_user_feedback,
    AVG(pul.execution_time_ms) as avg_execution_time,
    AVG(pul.generated_content_length) as avg_content_length,
    COUNT(CASE WHEN pul.success = false THEN 1 END) as error_count,
    MAX(pul.created_at) as last_used_at
FROM public.system_prompt_templates spt
LEFT JOIN public.prompt_usage_logs pul ON spt.id = pul.template_id
WHERE spt.is_active = true
GROUP BY spt.id, spt.name, spt.title, spt.version
ORDER BY usage_count DESC;

-- 완료 메시지
SELECT 
    '✅ 프롬프트 템플릿 시스템이 성공적으로 생성되었습니다!' as message,
    'Categories: ' || (SELECT COUNT(*) FROM public.prompt_categories) as categories_created,
    'Templates: ' || (SELECT COUNT(*) FROM public.system_prompt_templates) as templates_created,
    '관리 페이지에서 프롬프트를 관리하고 버전을 추적할 수 있습니다.' as note;