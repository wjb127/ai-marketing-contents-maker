# 🚀 자동 스케줄링 Quick Start Guide

## 🎯 추천 방법: QStash (무료로 시작)

### 1. QStash 계정 생성
1. [Upstash Console](https://console.upstash.com) 접속
2. QStash 프로젝트 생성
3. API 토큰 복사

### 2. 패키지 설치
```bash
npm install @upstash/qstash
```

### 3. 환경변수 설정 (.env.local)
```env
# QStash 설정
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=qstash_xxxxx
QSTASH_CURRENT_SIGNING_KEY=sig_xxxxx
QSTASH_NEXT_SIGNING_KEY=sig_xxxxx

# 크론잡 보안 (옵션)
CRON_SECRET=your-random-secret
```

### 4. 데이터베이스 업데이트
```sql
-- schedules 테이블에 컬럼 추가
ALTER TABLE public.schedules 
ADD COLUMN qstash_message_id TEXT,
ADD COLUMN next_run_at TIMESTAMP WITH TIME ZONE;
```

### 5. 테스트
```bash
# 개발 서버 실행
npm run dev

# 스케줄 생성 테스트
curl -X POST http://localhost:3000/api/schedule/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily Tech Content",
    "content_type": "x_post",
    "content_tone": "professional",
    "topic": "AI Technology",
    "frequency": "daily",
    "time_of_day": "09:00",
    "timezone": "Asia/Seoul"
  }'
```

## 🔄 대안: Vercel Cron (간단 버전)

### 사용자 < 100명인 경우

#### 1. vercel.json 생성
```json
{
  "crons": [
    {
      "path": "/api/cron/process-schedules",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

#### 2. 환경변수 설정
```env
CRON_SECRET=your-secret-key
```

#### 3. 배포
```bash
vercel --prod
```

## 📊 성능 비교

| 사용자 수 | Vercel Cron | QStash | 추천 |
|-----------|-------------|--------|------|
| < 100     | ✅ 가능     | ✅ 무료 | Vercel Cron |
| 100-1K    | ⚠️ 느림     | ✅ 무료 | QStash |
| 1K-10K    | ❌ 불가능   | ✅ 무료 | QStash |
| > 10K     | ❌ 불가능   | 💰 $10/월 | QStash |

## 🛠️ 구현 확인사항

### ✅ 체크리스트

- [ ] QStash 계정 생성 및 토큰 발급
- [ ] 환경변수 설정
- [ ] `/api/content/generate-scheduled` 엔드포인트 배포
- [ ] 스케줄 생성 테스트
- [ ] 실제 콘텐츠 생성 확인
- [ ] 에러 로그 모니터링

### 🔍 테스트 방법

1. **스케줄 생성**
   ```bash
   # 1분 후 실행되는 테스트 스케줄
   curl -X POST your-domain.com/api/schedule/test
   ```

2. **QStash 대시보드 확인**
   - [QStash Console](https://console.upstash.com) → Messages
   - 예약된 메시지 확인

3. **콘텐츠 생성 확인**
   - `/content/library`에서 자동 생성된 콘텐츠 확인

### 🚨 주의사항

1. **중복 실행 방지**
   - QStash 메시지 ID를 DB에 저장
   - 동일한 스케줄의 중복 예약 체크

2. **실패 처리**
   - 3회 자동 재시도
   - 실패 시 관리자 알림

3. **비용 모니터링**
   - QStash 사용량 대시보드 확인
   - 무료 한도 50만 메시지/월

## 🔧 고급 설정

### 배치 처리 (대량 사용자)
```typescript
// 한 번에 여러 스케줄 처리
const schedules = await getSchedulesToRun()
await qstash.messages.batchCreate(
  schedules.map(s => createMessage(s))
)
```

### 모니터링 설정
```typescript
// 실패율 모니터링
const failureRate = failedCount / totalCount
if (failureRate > 0.05) {
  await sendAlert('High failure rate detected')
}
```

### 사용량 제한
```typescript
// 사용자별 일일 한도
const dailyLimit = getUserDailyLimit(user)
if (todayCount >= dailyLimit) {
  return skipGeneration()
}
```

## 🆘 트러블슈팅

### QStash 메시지가 실행되지 않을 때
1. 서명 검증 확인
2. 엔드포인트 URL 확인 
3. 방화벽/보안 설정 확인

### 콘텐츠가 생성되지 않을 때
1. Anthropic API 키 확인
2. 사용자 구독 상태 확인
3. 월간 사용량 한도 확인

### 성능 문제
1. 배치 크기 조정 (50개씩)
2. 타임아웃 설정 증가
3. 데이터베이스 인덱스 최적화

## 📞 지원

- **QStash 문서**: https://docs.upstash.com/qstash
- **Vercel Cron 문서**: https://vercel.com/docs/cron-jobs
- **이슈 제보**: GitHub Issues