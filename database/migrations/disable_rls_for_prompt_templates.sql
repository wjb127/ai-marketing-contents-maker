-- 도그푸딩용: prompt_templates 테이블의 RLS 일시적으로 비활성화
ALTER TABLE public.prompt_templates DISABLE ROW LEVEL SECURITY;

-- 또는 모든 사용자가 접근할 수 있는 정책 추가 (RLS를 유지하면서)
-- CREATE POLICY "Allow all operations for dogfooding" ON public.prompt_templates
--     FOR ALL USING (true) WITH CHECK (true);