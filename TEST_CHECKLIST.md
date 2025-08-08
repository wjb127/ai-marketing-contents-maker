# 🧪 QStash 스케줄 테스트 체크리스트

## 사전 준비 ✅
- [x] Vercel 환경변수에서 `NEXT_PUBLIC_URL` 개행문자 제거
- [x] QStash 토큰 동기화 (로컬 = Production)
- [x] 코드 배포 완료

---

## 📋 테스트 순서

### 1️⃣ Upstash Console 접속
- [ ] https://console.upstash.com 접속
- [ ] GitHub 계정으로 로그인
- [ ] QStash 섹션 선택
- [ ] **Schedules** 탭 클릭

### 2️⃣ 테스트 대시보드 확인
- [ ] https://ai-sns-contents-maker.vercel.app/test-dashboard 접속
- [ ] 현재 KST 시간이 정확히 표시되는지 확인
- [ ] "1분 후 실행될 스케줄 생성" 버튼이 보이는지 확인

### 3️⃣ 일회성 스케줄 테스트 (기존 방식)
- [ ] 테스트 대시보드에서 "1분 후 실행될 스케줄 생성" 클릭
- [ ] 성공 토스트 메시지 확인
- [ ] 1분 대기
- [ ] "최근 실행 기록"에 새 항목이 나타나는지 확인
- [ ] Upstash Console > **Messages** 탭에서 메시지 확인

### 4️⃣ 반복 스케줄 테스트 (새 방식)
```bash
# 현재 시간 + 2분으로 설정 (예: 지금이 14:30이면 14:32로 설정)
curl -X POST https://ai-sns-contents-maker.vercel.app/api/qstash/schedules \
-H "Content-Type: application/json" \
-d '{
  "scheduleId": "console-test-001",
  "frequency": "daily",
  "timeOfDay": "HH:MM",  # 여기에 시간 입력
  "timezone": "Asia/Seoul"
}'
```
- [ ] API 호출 후 `qstashScheduleId` 반환 확인
- [ ] Upstash Console > **Schedules** 탭에 새 스케줄 표시 확인
- [ ] 2분 대기
- [ ] 스케줄 실행 확인

### 5️⃣ 기존 스케줄 페이지 테스트
- [ ] https://ai-sns-contents-maker.vercel.app/schedule 접속
- [ ] 새 스케줄 생성 (현재 시간 + 3분)
- [ ] 스케줄 카드에 정확한 "다음 실행" 시간 표시 확인
- [ ] 카운트다운 타이머 작동 확인
- [ ] 3분 후 실행되는지 확인

### 6️⃣ Upstash Console에서 모니터링
- [ ] **Messages** 탭: 전송된 메시지 목록 확인
- [ ] **Logs** 탭: 성공/실패 로그 확인
- [ ] **Analytics** 탭: 사용량 그래프 확인

---

## 🔍 디버깅 API

### 현재 QStash 스케줄 목록 조회
```bash
curl https://ai-sns-contents-maker.vercel.app/api/qstash/schedules
```

### 스케줄 디버그 정보
```bash
curl https://ai-sns-contents-maker.vercel.app/api/schedule/debug | jq '.'
```

### 시간 로거 실행 기록
```bash
curl https://ai-sns-contents-maker.vercel.app/api/test/time-logger
```

---

## ✅ 성공 기준

### 일회성 스케줄 (publishJSON)
- [ ] 지정된 시간에 정확히 실행
- [ ] test-dashboard에 실행 기록 표시
- [ ] Upstash Console Messages 탭에 기록

### 반복 스케줄 (schedules.create)
- [ ] Upstash Console Schedules 탭에 표시
- [ ] Cron 표현식 정확히 설정됨
- [ ] 매일 같은 시간에 반복 실행

---

## ❌ 문제 발생시 체크포인트

### 스케줄이 생성되지 않는 경우
- [ ] QStash 토큰이 올바른지 확인
- [ ] `NEXT_PUBLIC_URL`에 개행문자 없는지 재확인
- [ ] Vercel Functions 로그 확인

### 스케줄이 실행되지 않는 경우
- [ ] 시간대 설정 확인 (KST → UTC 변환)
- [ ] QStash 서명 키 일치 확인
- [ ] generate-scheduled API 응답 확인

### Upstash Console에서 보이지 않는 경우
- [ ] publishJSON (일회성) vs schedules.create (반복) 구분
- [ ] 올바른 탭 확인 (Messages vs Schedules)
- [ ] QStash 토큰이 Console 계정과 일치하는지 확인

---

## 📊 예상 결과

### 테스트 완료 후 확인 가능한 것들:
1. **test-dashboard**: 실행 기록 목록
2. **Upstash Console Messages**: 전송된 메시지들
3. **Upstash Console Schedules**: 반복 스케줄 목록
4. **Vercel Functions**: API 호출 로그

---

## 🎯 최종 확인

- [ ] 일회성 스케줄 정상 작동
- [ ] 반복 스케줄 Console에 표시
- [ ] 시간대 변환 정확
- [ ] 실행 로그 정상 기록

모든 항목이 체크되면 QStash 통합이 완벽하게 작동하는 것입니다! 🚀