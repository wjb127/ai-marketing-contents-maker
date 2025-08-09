# 시스템 안정화 마스터플랜 🛡️

## 근본 원인 (Root Cause Analysis)
1. **PostgreSQL ENUM 의존성**
   - 새 content type 추가 시 ALTER TYPE 필요
   - 스키마 캐시 불일치로 인한 런타임 오류
   - 개발/운영 환경 동기화 복잡성

2. **과도한 필드 복잡성**
   - auto_generated, estimated_read_time, metadata 등 비핵심 필드
   - 스키마 변경 시 의존성 폭증
   - 캐시 무효화 연쇄 반응

## 🎯 안정화 전략 (4단계)

### Phase 1: ENUM → TEXT 완전 마이그레이션 ✅
```sql
-- 실행할 SQL (Supabase Dashboard)
ALTER TABLE public.contents 
  ALTER COLUMN content_type TYPE TEXT,
  ALTER COLUMN tone TYPE TEXT,
  ALTER COLUMN status TYPE TEXT;

ALTER TABLE public.schedules
  ALTER COLUMN content_type TYPE TEXT,
  ALTER COLUMN frequency TYPE TEXT,
  ALTER COLUMN tone TYPE TEXT;

-- ENUM 타입 완전 제거
DROP TYPE IF EXISTS content_type_enum CASCADE;
DROP TYPE IF EXISTS content_tone_enum CASCADE;
DROP TYPE IF EXISTS content_status_enum CASCADE;
```

### Phase 2: 핵심 필드만 남기기 ✅
**KEEP (필수 필드):**
- user_id, title, content, content_type, tone, topic, status, created_at, updated_at

**REMOVE (문제 필드):**
- auto_generated → 불필요
- estimated_read_time → 계산으로 대체
- word_count → 프론트엔드에서 계산
- metadata → 복잡성 제거
- tags → 단순화

### Phase 3: 스키마 표준화
```sql
-- 최종 안정적인 스키마
CREATE TABLE public.contents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT NOT NULL,
    tone TEXT NOT NULL,
    topic TEXT NOT NULL, 
    status TEXT DEFAULT 'draft' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### Phase 4: 운영 안정성 보장
1. **환경 일치성**
   - 개발/운영 스키마 동기화 스크립트
   - 마이그레이션 자동화

2. **에러 핸들링 강화**
   - Graceful fallback 패턴
   - 상세한 에러 로깅
   - 재시도 메커니즘

3. **모니터링**
   - 스키마 버전 추적
   - API 성공률 모니터링
   - 성능 지표 수집

## 🔧 즉시 실행 가능한 액션

1. **Supabase에서 ENUM→TEXT 마이그레이션 실행**
2. **스키마 캐시 새로고침** (Dashboard → Settings → API → Reload Schema)
3. **불필요한 필드 제거 완료** (이미 진행 중)
4. **테스트 자동화** 구축

## 📊 성공 지표
- [ ] 콘텐츠 생성 성공률 > 99%
- [ ] 새 content type 추가 시 배포 불필요
- [ ] 스키마 오류 0건
- [ ] 개발/운영 환경 일치성 100%

## 🚨 향후 금지사항
- ❌ PostgreSQL ENUM 절대 사용 금지
- ❌ 새로운 복합 필드 추가 금지  
- ❌ 스키마 변경 없이 기능 구현 우선
- ❌ 캐시 의존성 있는 구조 금지

## ✅ 허용 패턴
- ✅ TEXT 필드로 모든 enum 값 처리
- ✅ 프론트엔드에서 파생 데이터 계산
- ✅ 단순하고 명확한 필드 구조
- ✅ 상태 코드는 string literal types 사용