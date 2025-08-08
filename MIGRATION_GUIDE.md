# QStash 마이그레이션 가이드

## 1단계: Vercel 마켓플레이스 통합 제거

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택
3. **Settings** → **Integrations**
4. QStash 통합 찾기
5. **"Configure"** 클릭 → **"Remove Integration"**

## 2단계: 직접 Upstash 계정 설정

1. [Upstash Console](https://console.upstash.com) 접속
2. **Sign Up** 또는 **Sign In**
3. 좌측 메뉴에서 **QStash** 선택
4. **Create QStash** 클릭
5. 다음 정보 복사:
   - QStash Token
   - Current Signing Key
   - Next Signing Key

## 3단계: Vercel 환경변수 업데이트

### Vercel Dashboard에서:

1. **Settings** → **Environment Variables**
2. 기존 QStash 변수들 삭제 (자동 생성된 것들)
3. 새로운 변수 추가:

```env
QSTASH_TOKEN=qstash_xxxxx... (Upstash에서 복사한 값)
QSTASH_CURRENT_SIGNING_KEY=sig_xxxxx... (Upstash에서 복사한 값)
QSTASH_NEXT_SIGNING_KEY=sig_xxxxx... (Upstash에서 복사한 값)
QSTASH_URL=https://qstash.upstash.io
NEXT_PUBLIC_URL=https://ai-sns-contents-maker.vercel.app (개행문자 없이!)
```

## 4단계: 로컬 환경 업데이트

`.env.local` 파일 수정:

```env
# QStash (Upstash) - 직접 관리
QSTASH_TOKEN=새로운_토큰_값
QSTASH_CURRENT_SIGNING_KEY=새로운_서명_키
QSTASH_NEXT_SIGNING_KEY=새로운_다음_서명_키
QSTASH_URL=https://qstash.upstash.io
NEXT_PUBLIC_URL=https://ai-sns-contents-maker.vercel.app
```

## 5단계: 기존 스케줄 재설정

기존 스케줄들의 QStash 메시지 ID가 무효화되므로:

```sql
-- 모든 스케줄의 QStash 메시지 ID 초기화
UPDATE schedules 
SET qstash_message_id = NULL 
WHERE is_active = true;
```

또는 API를 통해:

```javascript
// 모든 활성 스케줄 재생성
const schedules = await getActiveSchedules();
for (const schedule of schedules) {
  await recreateQStashMessage(schedule);
}
```

## 6단계: 테스트

1. **로컬 테스트**:
```bash
npm run dev
# 스케줄 생성 테스트
```

2. **Production 배포**:
```bash
git add .
git commit -m "Migrate to direct QStash management"
git push
```

3. **Upstash Console에서 확인**:
- Messages 탭에서 새 메시지 생성 확인
- Logs 탭에서 실행 로그 확인

## 장점

### 직접 관리시:
- ✅ **완전한 가시성**: 모든 메시지와 로그 확인 가능
- ✅ **디버깅 용이**: 실패 원인 즉시 파악
- ✅ **비용 관리**: 사용량 직접 모니터링
- ✅ **멀티 환경**: dev/staging/prod 분리 가능

### 주의사항:
- ⚠️ Upstash 무료 티어: 월 10,000 메시지
- ⚠️ 환경변수 정확히 설정 필요
- ⚠️ 서명 키 주기적 로테이션 권장

## 문제 해결

### QStash 메시지가 생성되지 않는 경우:
1. 토큰이 올바른지 확인
2. Upstash Console에서 QStash 활성화 확인
3. API 응답의 에러 메시지 확인

### 웹훅이 실행되지 않는 경우:
1. URL에 개행문자나 공백 없는지 확인
2. 서명 검증 키가 일치하는지 확인
3. Upstash Console → Logs에서 실패 원인 확인

### 시간대 문제:
- QStash는 UTC 사용
- 코드에서 KST → UTC 변환 확인
- `calculateNextRun` 함수 로직 검증