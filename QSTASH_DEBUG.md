# QStash 디버깅 가이드

## 문제 상황
- 스케줄이 생성되지만 실제 시간에 실행되지 않음
- QStash 메시지 ID는 생성되지만 실행 확인 불가

## Vercel 마켓플레이스 QStash 확인 방법

### 1. Vercel Dashboard에서 확인
1. https://vercel.com/dashboard 접속
2. 프로젝트 선택 (ai-sns-contents-maker)
3. **Integrations** 탭 클릭
4. QStash 통합 상태 확인
5. "Manage" 또는 "Configure" 클릭하여 Upstash 콘솔로 이동

### 2. Upstash Console 직접 접속
1. https://console.upstash.com 접속
2. Vercel과 연동된 이메일로 로그인
3. **QStash** 섹션 확인
4. **Messages** 탭에서 전송된 메시지 확인
5. **Logs** 탭에서 실행 로그 확인

### 3. Vercel 환경변수 확인
1. Vercel Dashboard → Settings → Environment Variables
2. 다음 변수들이 자동으로 설정되어 있는지 확인:
   - `QSTASH_URL`
   - `QSTASH_TOKEN` 
   - `QSTASH_CURRENT_SIGNING_KEY`
   - `QSTASH_NEXT_SIGNING_KEY`

### 4. Vercel Functions 로그 확인
1. Vercel Dashboard → Functions 탭
2. `api/content/generate-scheduled` 함수 선택
3. 실행 로그 및 에러 확인

## 주요 확인 사항

### QStash 메시지가 생성되었지만 실행 안 되는 경우:

1. **URL 문제**
   - `NEXT_PUBLIC_URL` 환경변수에 개행문자나 공백 없는지 확인
   - 현재 값: `https://ai-sns-contents-maker.vercel.app\n` (개행문자 포함됨)
   - 수정 필요: Vercel Dashboard에서 환경변수 편집

2. **서명 검증 실패**
   - QStash가 보내는 서명과 앱에서 검증하는 키가 일치하지 않을 수 있음
   - Vercel 자동 설정과 수동 설정이 충돌할 가능성

3. **시간대 문제**
   - QStash는 UTC 시간 사용
   - 현재 코드는 KST → UTC 변환 처리됨

## 테스트 방법

### 즉시 실행 테스트
```bash
# 현재 시간 + 1분 후 실행되도록 스케줄 생성
curl -X POST https://ai-sns-contents-maker.vercel.app/api/schedule/create \
-H "Content-Type: application/json" \
-d '{
  "name": "즉시 실행 테스트",
  "content_type": "x_post",
  "content_tone": "casual",
  "topic": "테스트",
  "frequency": "daily",
  "time_of_day": "HH:MM", # 1분 후 시간 입력
  "timezone": "Asia/Seoul"
}'
```

### 실행 확인
1. Vercel Functions 로그에서 `generate-scheduled` 호출 확인
2. Upstash Console에서 메시지 상태 확인
3. 데이터베이스에서 `last_run_at` 업데이트 확인

## 해결된 문제들
- ✅ 시간 표시 문제 (KST 입력 → KST 표시)
- ✅ 시간 계산 로직 (2분 여유시간 추가)
- ✅ URL trim() 처리 추가

## 추가 확인 필요
- QStash 웹훅 실제 호출 여부
- Vercel 마켓플레이스 통합 상태
- 환경변수 정확성