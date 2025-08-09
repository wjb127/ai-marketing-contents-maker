# Supabase 프로젝트 마이그레이션 가이드

## 개요
기존 Supabase 프로젝트에서 새로운 Supabase 프로젝트로 데이터와 스키마를 마이그레이션하는 단계별 가이드입니다.

## 1. 사전 준비

### 1.1 기존 데이터베이스 백업
```bash
# Supabase CLI 설치 (필요한 경우)
npm install -g supabase

# 기존 프로젝트 스키마 덤프
supabase db dump --db-url "postgresql://postgres:[password]@[host]:5432/postgres" > backup_schema.sql

# 또는 pgdump 직접 사용
pg_dump "postgresql://postgres:[password]@[host]:5432/postgres" > backup_full.sql
```

### 1.2 환경 변수 백업
현재 `.env.local` 파일 백업:
```bash
cp .env.local .env.local.backup
```

## 2. 새로운 Supabase 프로젝트 생성

### 2.1 Supabase 대시보드에서 프로젝트 생성
1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: `ai-sns-contents-maker-v2` (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 설정
   - **Region**: Seoul (ap-northeast-1) 또는 가까운 지역
4. "Create new project" 클릭
5. 프로젝트 생성 완료까지 대기 (약 2-3분)

### 2.2 새 프로젝트 정보 확인
프로젝트 생성 후 다음 정보 복사:
- **Project URL**: `https://[project-id].supabase.co`
- **Anon Public Key**: `eyJ...` (공개 키)
- **Service Role Key**: `eyJ...` (서비스 키, 백엔드 전용)
- **Database URL**: `postgresql://postgres:[password]@[host]:5432/postgres`

## 3. 스키마 마이그레이션

### 3.1 스키마 파일 준비
기존 프로젝트의 스키마 구조를 확인하고 새 프로젝트에 적용할 SQL 파일 생성:

```sql
-- schema.sql
-- 사용자 테이블
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    subscription_status VARCHAR(50) DEFAULT 'free',
    subscription_plan VARCHAR(50) DEFAULT 'free',
    monthly_content_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 콘텐츠 테이블
CREATE TABLE public.contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    target_audience TEXT,
    additional_instructions TEXT,
    prompt TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    schedule_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 스케줄 테이블
CREATE TABLE public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    content_tone VARCHAR(50) DEFAULT 'casual',
    topic TEXT,
    target_audience TEXT,
    additional_instructions TEXT,
    frequency VARCHAR(20) NOT NULL,
    time_of_day TIME NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Asia/Seoul',
    is_active BOOLEAN DEFAULT true,
    next_run_at TIMESTAMP WITH TIME ZONE,
    last_run_at TIMESTAMP WITH TIME ZONE,
    qstash_message_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- 사용자별 데이터 접근 정책
CREATE POLICY "Users can view own data" ON public.users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can view own contents" ON public.contents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own schedules" ON public.schedules FOR ALL USING (auth.uid() = user_id);

-- 인덱스 생성
CREATE INDEX idx_contents_user_id ON public.contents(user_id);
CREATE INDEX idx_contents_created_at ON public.contents(created_at DESC);
CREATE INDEX idx_schedules_user_id ON public.schedules(user_id);
CREATE INDEX idx_schedules_next_run_at ON public.schedules(next_run_at);
```

### 3.2 Supabase SQL Editor에서 스키마 적용
1. 새 Supabase 프로젝트 대시보드 접속
2. 좌측 메뉴에서 "SQL Editor" 클릭
3. "New query" 클릭
4. 위의 스키마 SQL 코드 붙여넣기
5. "Run" 버튼 클릭하여 실행

## 4. 환경 변수 업데이트

### 4.1 .env.local 파일 수정
```bash
# 새로운 Supabase 프로젝트 정보로 업데이트
NEXT_PUBLIC_SUPABASE_URL=https://[new-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...[new-anon-key]
SUPABASE_SERVICE_ROLE_KEY=eyJ...[new-service-key]

# 기존 다른 환경 변수들은 그대로 유지
ANTHROPIC_API_KEY=sk-ant-...
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=qstash_...
QSTASH_CURRENT_SIGNING_KEY=sig_...
TOSS_CLIENT_KEY=test_ck_...
TOSS_SECRET_KEY=test_sk_...
NEXT_PUBLIC_URL=https://your-domain.com
```

### 4.2 환경 변수 검증
```bash
# 개발 서버 재시작하여 새 환경 변수 적용
npm run dev

# 브라우저에서 데이터베이스 연결 확인
# /api/test/db-connection 엔드포인트 생성하여 테스트 가능
```

## 5. 데이터 마이그레이션 (선택사항)

### 5.1 기존 데이터 백업
```sql
-- 기존 데이터베이스에서 실행
COPY (SELECT * FROM public.users) TO '/tmp/users.csv' WITH CSV HEADER;
COPY (SELECT * FROM public.contents) TO '/tmp/contents.csv' WITH CSV HEADER;
COPY (SELECT * FROM public.schedules) TO '/tmp/schedules.csv' WITH CSV HEADER;
```

### 5.2 새 데이터베이스에 데이터 임포트
```sql
-- 새 데이터베이스에서 실행
COPY public.users FROM '/tmp/users.csv' WITH CSV HEADER;
COPY public.contents FROM '/tmp/contents.csv' WITH CSV HEADER;
COPY public.schedules FROM '/tmp/schedules.csv' WITH CSV HEADER;
```

## 6. 애플리케이션 테스트

### 6.1 기본 기능 테스트
- [ ] 사용자 인증 (회원가입/로그인)
- [ ] 콘텐츠 생성 기능
- [ ] 콘텐츠 목록 조회
- [ ] 스케줄 생성 기능
- [ ] 스케줄 목록 조회

### 6.2 API 엔드포인트 테스트
```bash
# 헬스체크
curl http://localhost:3000/api/health

# 데이터베이스 연결 테스트
curl http://localhost:3000/api/test/db-connection
```

## 7. 프로덕션 배포

### 7.1 Vercel 환경 변수 업데이트
```bash
# Vercel CLI 사용
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# 또는 Vercel 대시보드에서 수동으로 업데이트
```

### 7.2 배포 후 검증
- [ ] 프로덕션 환경에서 데이터베이스 연결 확인
- [ ] 모든 핵심 기능 동작 확인
- [ ] 에러 로그 모니터링

## 8. 롤백 계획

### 8.1 롤백 준비사항
- 기존 환경 변수 백업 파일 보관 (`.env.local.backup`)
- 기존 Supabase 프로젝트는 마이그레이션 완료 후 일정 기간 유지
- DNS 설정 변경 시 TTL 값을 낮게 설정

### 8.2 롤백 절차
```bash
# 1. 환경 변수 롤백
cp .env.local.backup .env.local

# 2. 애플리케이션 재시작
npm run dev

# 3. Vercel 환경 변수도 이전 값으로 복원
```

## 9. 마이그레이션 후 정리

### 9.1 성능 최적화
- 새 데이터베이스 인덱스 최적화
- Connection pooling 설정 확인
- 쿼리 성능 모니터링

### 9.2 모니터링 설정
- Supabase 대시보드에서 성능 메트릭 확인
- 에러 로그 모니터링 설정
- 백업 스케줄 설정

## 10. 체크리스트

### 마이그레이션 완료 체크리스트
- [ ] 새 Supabase 프로젝트 생성
- [ ] 스키마 마이그레이션 완료
- [ ] 환경 변수 업데이트
- [ ] 로컬 테스트 완료
- [ ] 데이터 마이그레이션 (필요한 경우)
- [ ] 프로덕션 배포
- [ ] 프로덕션 테스트 완료
- [ ] 모니터링 설정 완료
- [ ] 문서 업데이트
- [ ] 팀 공유

## 주의사항

1. **다운타임 최소화**: DNS 변경이나 환경 변수 업데이트 시 서비스 중단 시간을 최소화하세요.
2. **데이터 백업**: 마이그레이션 전 반드시 전체 데이터 백업을 수행하세요.
3. **단계적 진행**: 한 번에 모든 것을 변경하지 말고 단계적으로 진행하세요.
4. **롤백 준비**: 문제 발생 시 즉시 롤백할 수 있도록 준비하세요.
5. **테스트 환경**: 가능하면 스테이징 환경에서 먼저 테스트하세요.

---

**작성일**: 2025-08-09  
**작성자**: Claude AI  
**버전**: 1.0