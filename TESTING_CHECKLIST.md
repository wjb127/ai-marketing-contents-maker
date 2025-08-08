# 🧪 AI SNS 콘텐츠 메이커 - 핵심 기능 테스트 체크리스트

## 📋 개요
새로운 기능을 구현하거나 기존 기능을 수정할 때마다 반드시 테스트해야 할 핵심 기능들을 정리한 문서입니다.

---

## 🎯 **1. 콘텐츠 생성 (Manual Content Generation)**

### 테스트 환경
- **URL**: `/content/create`
- **API**: `/api/content/generate`

### ✅ 테스트 체크리스트
- [ ] **기본 콘텐츠 생성**: 모든 콘텐츠 타입별 생성 확인
  - [ ] X(Twitter) 포스트
  - [ ] 스레드
  - [ ] 블로그 포스트
  - [ ] YouTube 스크립트
  - [ ] Instagram 릴 스크립트
  - [ ] LinkedIn 포스트
  - [ ] Facebook 포스트

- [ ] **톤 변경**: 각 톤별 콘텐츠 생성 확인
  - [ ] Casual (캐주얼)
  - [ ] Professional (전문적)
  - [ ] Friendly (친근한)
  - [ ] Formal (공식적)

- [ ] **창의성 레벨**: 각 레벨별 생성 확인
  - [ ] Conservative (보수적)
  - [ ] Balanced (균형)
  - [ ] Creative (창의적)

- [ ] **에러 처리**
  - [ ] AI API 키 누락 시 적절한 에러 메시지
  - [ ] 네트워크 오류 시 재시도 로직
  - [ ] 생성 실패 시 사용자에게 명확한 피드백

### 🔍 확인 포인트
```bash
# 테스트 콘텐츠 생성
curl -X POST http://localhost:3000/api/content/generate \
  -H "Content-Type: application/json" \
  -d '{
    "contentType": "x_post",
    "tone": "casual", 
    "topic": "테스트 주제",
    "targetAudience": "개발자",
    "additionalInstructions": "테스트용"
  }'
```

---

## ⏰ **2. 스케줄 등록 (Schedule Creation)**

### 테스트 환경
- **URL**: `/schedule`
- **API**: `/api/schedule/create`

### ✅ 테스트 체크리스트
- [ ] **기본 스케줄 생성**
  - [ ] 필수 필드 모두 입력하여 생성
  - [ ] 생성 후 데이터베이스에 저장 확인
  - [ ] QStash 메시지 생성 확인

- [ ] **빈도별 스케줄 생성**
  - [ ] Daily (매일)
  - [ ] Weekly (매주) 
  - [ ] Monthly (매월)
  - [ ] 3시간마다
  - [ ] 6시간마다

- [ ] **시간대 처리**
  - [ ] 한국시간(KST) 입력 시 UTC로 정확한 변환
  - [ ] 다음 실행 시간 계산 정확성
  - [ ] 시간대 변경 시 올바른 스케줄링

- [ ] **QStash 연동**
  - [ ] QStash 메시지 ID 저장 확인
  - [ ] 스케줄 생성 시 QStash 큐에 등록 확인
  - [ ] QStash 콘솔에서 메시지 확인

### 🔍 확인 포인트
```bash
# 테스트 스케줄 생성
curl -X POST http://localhost:3000/api/schedule/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "테스트 스케줄",
    "content_type": "x_post",
    "content_tone": "casual",
    "topic": "테스트",
    "frequency": "daily",
    "time_of_day": "09:00",
    "timezone": "Asia/Seoul"
  }'
```

---

## 🔧 **3. 스케줄 시간 변경 (Schedule Update)**

### 테스트 환경
- **URL**: `/schedule` (기존 스케줄 수정)
- **API**: `/api/schedule/update`

### ✅ 테스트 체크리스트
- [ ] **시간 변경**
  - [ ] 기존 QStash 메시지 취소 확인
  - [ ] 새로운 시간으로 QStash 메시지 재생성
  - [ ] `qstash_message_id` 업데이트 확인

- [ ] **빈도 변경**
  - [ ] Daily → Weekly 변경 시 다음 실행 시간 재계산
  - [ ] Weekly → Daily 변경 시 다음 실행 시간 재계산

- [ ] **중복 방지 로직**
  - [ ] 기존 메시지 취소 로그 확인: "🗑️ Cancelling existing QStash message"
  - [ ] 새 메시지 생성 로그 확인
  - [ ] 중복 실행이 발생하지 않는지 확인

### 🔍 확인 포인트
- QStash 콘솔에서 기존 메시지 취소되고 새 메시지 생성 확인
- 데이터베이스에서 `qstash_message_id`와 `next_run_at` 업데이트 확인

---

## ⚡ **4. 스케줄 자동 실행 (Scheduled Execution)**

### 테스트 환경
- **API**: `/api/content/generate-scheduled-v2`
- **대시보드**: `/test-dashboard`

### ✅ 테스트 체크리스트
- [ ] **v2 API 실행 확인**
  - [ ] 스케줄 조회 성공
  - [ ] 사용자 조회 성공
  - [ ] 구독 상태 확인
  - [ ] AI 콘텐츠 생성 성공
  - [ ] 데이터베이스 저장 성공
  - [ ] 사용량 카운트 업데이트
  - [ ] 다음 실행 시간 계산 및 예약

- [ ] **에러 처리 및 격리**
  - [ ] AI 생성 실패 시에도 다음 단계 진행
  - [ ] 데이터베이스 저장 실패 시에도 다음 단계 진행
  - [ ] 각 단계별 에러 로깅 확인

- [ ] **로그 모니터링**
  ```
  ✅ 정상 실행 로그 패턴:
  🚀 Generate-scheduled-v2 API called
  📋 Processing schedule: [schedule_id]
  ✅ Schedule found: [schedule_name]
  ✅ User found: [user_id]
  🤖 Generating content with AI...
  ✅ Content generated successfully
  💾 Saving content to database...
  ✅ Content saved: [content_id]
  ✅ Usage updated
  🗑️ Cancelling existing QStash message: [old_message_id]
  ✅ Next run scheduled: [next_run_time]
  ✅ Logged to time-logger successfully
  ```

### 🔍 확인 포인트
```bash
# 수동으로 스케줄 실행 테스트
curl -X POST https://ai-sns-contents-maker.vercel.app/api/content/generate-scheduled-v2 \
  -H "Content-Type: application/json" \
  -d '{"scheduleId": "[SCHEDULE_ID]", "timestamp": "'$(date -Iseconds)'"}'

# 응답 확인: {"success":true,"message":"v2 API completed successfully",...}
```

---

## 🧹 **5. 테스트 환경 관리**

### 테스트 대시보드
- **URL**: `/test-dashboard`

### ✅ 관리 체크리스트
- [ ] **스케줄 모니터링**
  - [ ] 등록된 테스트 스케줄 목록 확인
  - [ ] 실행된 스케줄 기록 확인
  - [ ] 스케줄 상태(활성/비활성) 확인

- [ ] **테스트 데이터 정리**
  - [ ] "🛑 모든 테스트 스케줄 비활성화" 버튼 작동 확인
  - [ ] QStash 메시지 취소 확인
  - [ ] 스케줄 `is_active = false` 업데이트 확인

### 🔍 확인 포인트
```bash
# 테스트 스케줄 비활성화
curl -X POST https://ai-sns-contents-maker.vercel.app/api/schedule/deactivate-all \
  -H "Content-Type: application/json"

# 테스트 스케줄 목록 확인
curl -s "https://ai-sns-contents-maker.vercel.app/api/test/schedules" | jq '.schedules | length'
```

---

## 🚨 **6. 환경별 설정 확인**

### ✅ 환경변수 체크리스트
- [ ] **개발 환경 (Local)**
  - [ ] `.env.local` 파일 존재 확인
  - [ ] `ANTHROPIC_API_KEY` 설정 확인
  - [ ] `QSTASH_TOKEN` 설정 확인
  - [ ] `NEXT_PUBLIC_URL=http://localhost:3000` 확인

- [ ] **운영 환경 (Vercel)**
  - [ ] Vercel Dashboard → Environment Variables 확인
  - [ ] `ANTHROPIC_API_KEY` 설정 확인
  - [ ] `QSTASH_TOKEN` 설정 확인
  - [ ] `NEXT_PUBLIC_URL=https://ai-sns-contents-maker.vercel.app` 확인

### 🔍 확인 포인트
- 빌드 로그에서 "QStash Configuration Check" 확인
- 모든 환경변수가 "✅ Set"으로 표시되는지 확인

---

## 📊 **7. Analytics & Monitoring**

### ✅ 모니터링 체크리스트
- [ ] **Vercel Analytics**
  - [ ] 페이지뷰 데이터 수집 확인
  - [ ] 사용자 행동 추적 확인

- [ ] **Vercel Speed Insights**
  - [ ] 페이지 로딩 속도 측정 확인
  - [ ] Core Web Vitals 데이터 확인

- [ ] **애플리케이션 로그**
  - [ ] QStash 실행 로그 모니터링
  - [ ] 에러 로그 및 스택 트레이스 확인

---

## 🎯 **핵심 테스트 시나리오**

### 🔥 **Critical Path Testing**
새로운 기능 배포 전 반드시 테스트해야 할 핵심 시나리오:

1. **End-to-End 테스트**
   ```bash
   # 1. 테스트 스케줄 생성
   curl -X POST .../api/schedule/test
   
   # 2. 1분 후 자동 실행 확인
   # 3. 생성된 콘텐츠 확인
   # 4. 다음 스케줄 예약 확인
   # 5. 테스트 데이터 정리
   curl -X POST .../api/schedule/deactivate-all
   ```

2. **에러 복구 테스트**
   - AI API 키 제거 → 실행 → 키 복구 → 정상 실행 확인
   - QStash 토큰 제거 → 실행 → 토큰 복구 → 정상 실행 확인

3. **타임존 테스트**
   - 한국 시간 09:00로 설정 → UTC 00:00 변환 확인
   - 실행 후 다음날 09:00(KST)로 재예약 확인

---

## 📝 **테스트 실행 템플릿**

```markdown
## 테스트 일자: YYYY-MM-DD
## 테스트자: [이름]
## 변경 내용: [간단한 설명]

### 실행한 테스트
- [ ] 콘텐츠 생성
- [ ] 스케줄 등록  
- [ ] 스케줄 시간 변경
- [ ] 스케줄 자동 실행
- [ ] 테스트 데이터 정리

### 발견된 이슈
- 이슈1: [설명]
- 이슈2: [설명]

### 결론
- [ ] 모든 핵심 기능 정상 작동
- [ ] 운영 배포 준비 완료
```

---

**💡 팁**: 이 체크리스트를 기반으로 자동화된 테스트 스크립트를 만들면 더욱 효율적입니다!