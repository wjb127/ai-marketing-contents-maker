# 자동화된 콘텐츠 생성 스케줄링 아키텍처

## 📋 요구사항 분석

### 핵심 요구사항:
1. **개별 사용자 스케줄**: 각 사용자가 독립적인 스케줄 설정
2. **다양한 주기**: 일간, 주간, 월간 등 다양한 반복 주기
3. **확장성**: 사용자 증가에 따른 스케일링 가능
4. **신뢰성**: 실패 시 재시도, 중복 실행 방지
5. **비용 효율성**: 사용량에 따른 합리적인 비용

## 🏗️ 스케줄링 방법론 비교

### 1. Vercel Cron Jobs (현재 고려중)

**구현 방식:**
```typescript
// vercel.json
{
  "crons": [{
    "path": "/api/cron/generate-content",
    "schedule": "*/5 * * * *" // 5분마다
  }]
}
```

**장점:**
- 설정이 매우 간단
- Vercel 인프라에 통합
- 별도 서비스 불필요

**단점:**
- **최대 제한**: Hobby는 2개, Pro는 40개 크론잡
- **최소 간격**: 1시간 (Hobby), 1분 (Pro)
- **사용자별 개별 스케줄 불가능**
- 모든 사용자를 한 번에 처리해야 함

**적합한 경우:**
- 사용자 수 < 1000명
- 동일한 시간대에 일괄 처리 가능

### 2. Queue 기반 시스템 (추천) 🌟

**구현 방식:**
```typescript
// Upstash Queue + QStash 예시
import { Queue } from '@upstash/queue'

// 사용자가 스케줄 생성 시
await qstash.publishJSON({
  url: "https://your-app.vercel.app/api/generate-content",
  body: { userId, scheduleId },
  delay: "1h", // 1시간 후
  retries: 3
})
```

**장점:**
- 개별 사용자 스케줄 가능
- 무제한 확장 가능
- 실패 시 자동 재시도
- 정확한 실행 시간 보장

**단점:**
- 외부 서비스 의존
- 추가 비용 발생

**추천 서비스:**
1. **Upstash QStash** (최고 추천)
   - 가격: 50만 메시지/월 무료
   - Vercel Edge 최적화
   - 간단한 API

2. **Inngest**
   - 이벤트 기반 워크플로우
   - 복잡한 로직 처리 가능
   - 디버깅 UI 제공

### 3. Supabase Edge Functions + pg_cron

**구현 방식:**
```sql
-- Supabase에서 pg_cron 활성화
SELECT cron.schedule(
  'generate-contents',
  '*/30 * * * *', -- 30분마다
  $$
  SELECT http_post(
    'https://your-edge-function.supabase.co',
    '{"action": "generate"}',
    'application/json'
  );
  $$
);
```

**장점:**
- 데이터베이스 내장 기능
- 추가 서비스 불필요
- 비용 효율적

**단점:**
- 복잡한 스케줄링 로직 구현 어려움
- Supabase 종속

### 4. 하이브리드 접근법 (대규모 추천) 🚀

**아키텍처:**
```
Vercel Cron (마스터 스케줄러)
    ↓ (5분마다)
Queue Service (QStash/BullMQ)
    ↓ (개별 작업 분배)
API Endpoints (콘텐츠 생성)
    ↓
Database (저장)
```

## 🎯 추천 아키텍처: QStash + Vercel

### 구현 단계:

#### 1. 스케줄 생성 시
```typescript
// /api/schedule/create
export async function POST(req: Request) {
  const { frequency, time, timezone } = await req.json()
  
  // DB에 스케줄 저장
  const schedule = await createSchedule(...)
  
  // 다음 실행 시간 계산
  const nextRun = calculateNextRun(frequency, time, timezone)
  
  // QStash에 예약
  await qstash.publishJSON({
    url: `${process.env.NEXT_PUBLIC_URL}/api/content/generate-scheduled`,
    body: { scheduleId: schedule.id },
    notBefore: nextRun.getTime() / 1000, // Unix timestamp
  })
}
```

#### 2. 콘텐츠 생성 엔드포인트
```typescript
// /api/content/generate-scheduled
export async function POST(req: Request) {
  const { scheduleId } = await req.json()
  
  // 스케줄 정보 조회
  const schedule = await getSchedule(scheduleId)
  
  // 사용자 구독 확인
  if (!checkUserSubscription(schedule.userId)) {
    return // 구독 만료 시 중단
  }
  
  // 콘텐츠 생성
  await generateContent(schedule)
  
  // 다음 실행 예약
  if (schedule.is_active) {
    const nextRun = calculateNextRun(schedule)
    await qstash.publishJSON({
      url: `${process.env.NEXT_PUBLIC_URL}/api/content/generate-scheduled`,
      body: { scheduleId },
      notBefore: nextRun.getTime() / 1000,
    })
  }
}
```

#### 3. 모니터링 크론잡 (선택사항)
```typescript
// /api/cron/check-schedules
// vercel.json에서 1시간마다 실행
export async function GET() {
  // 누락된 스케줄 확인
  const missedSchedules = await checkMissedSchedules()
  
  // 재예약
  for (const schedule of missedSchedules) {
    await reschedule(schedule)
  }
}
```

## 💰 비용 분석

### QStash 비용:
- **무료**: 50만 메시지/월
- **Pro**: $10/월 (500만 메시지)

### 예상 사용량:
- 사용자당 일일 1회 스케줄: 30 메시지/월
- 1,000명 사용자: 30,000 메시지/월 (무료 tier 충분)
- 10,000명 사용자: 300,000 메시지/월 (무료 tier 충분)

## 🔧 구현 체크리스트

1. **QStash 설정**
   ```bash
   npm install @upstash/qstash
   ```

2. **환경변수 추가**
   ```env
   QSTASH_URL=https://qstash.upstash.io
   QSTASH_TOKEN=your-token
   QSTASH_CURRENT_SIGNING_KEY=your-signing-key
   QSTASH_NEXT_SIGNING_KEY=your-next-signing-key
   ```

3. **API 엔드포인트 생성**
   - `/api/schedule/create` - 스케줄 생성
   - `/api/schedule/update` - 스케줄 수정
   - `/api/schedule/delete` - 스케줄 삭제
   - `/api/content/generate-scheduled` - 예약 콘텐츠 생성

4. **보안 검증**
   ```typescript
   import { verifySignature } from '@upstash/qstash/nextjs'
   
   export const POST = verifySignature(handler)
   ```

5. **에러 처리**
   - 재시도 로직
   - 실패 알림
   - 중복 실행 방지

## 🚦 마이그레이션 전략

### Phase 1: MVP (현재)
- 수동 콘텐츠 생성만 지원
- 스케줄 UI는 있지만 자동 실행 안됨

### Phase 2: Beta (사용자 < 100)
- Vercel Cron으로 간단히 구현
- 5분마다 모든 스케줄 체크

### Phase 3: Growth (사용자 < 1000)
- QStash 도입
- 개별 스케줄링 구현

### Phase 4: Scale (사용자 > 1000)
- 모니터링 강화
- 실패 복구 자동화
- 성능 최적화

## 📊 모니터링

1. **QStash Dashboard**
   - 실행 현황
   - 실패율
   - 지연 시간

2. **Custom Metrics**
   - 일일 생성 콘텐츠 수
   - 스케줄 실행 성공률
   - API 응답 시간

3. **알림 설정**
   - 실패율 > 5%
   - 지연 > 5분
   - 일일 할당량 초과

## 🎯 결론 및 추천

**즉시 시작**: Vercel Cron + 배치 처리
**3개월 내**: QStash 마이그레이션
**장기적**: 하이브리드 아키텍처

QStash를 추천하는 이유:
1. Vercel과 완벽한 통합
2. 개별 사용자 스케줄링 가능
3. 무료 tier가 충분히 관대함
4. 구현이 간단하고 안정적
5. 스케일링이 자동으로 처리됨