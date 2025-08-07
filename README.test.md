# 테스트 가이드 (TDD)

## 🚀 테스트 환경 설정

```bash
# 테스트 의존성 설치
chmod +x setup-tests.sh
./setup-tests.sh

# 또는 직접 설치
npm install --save-dev jest @types/jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event msw whatwg-fetch
```

## 📝 테스트 실행

```bash
# 모든 테스트 실행
npm test

# 감시 모드로 실행 (파일 변경 시 자동 재실행)
npm run test:watch

# 커버리지 리포트 생성
npm run test:coverage
```

## 🎯 테스트 구조

### 1. **유닛 테스트**
- `/src/__tests__/lib/` - 라이브러리 함수 테스트
  - `qstash.test.ts` - QStash 스케줄링 함수 테스트

### 2. **API 테스트**
- `/src/__tests__/api/` - API 엔드포인트 테스트
  - `schedule/create.test.ts` - 스케줄 생성 API
  - `schedule/update.test.ts` - 스케줄 업데이트 API
  - `content/generate.test.ts` - 콘텐츠 생성 API

### 3. **훅 테스트**
- `/src/__tests__/hooks/` - React 커스텀 훅 테스트
  - `useSchedules.test.tsx` - 스케줄 관리 훅

### 4. **컴포넌트 테스트**
- `/src/__tests__/components/` - React 컴포넌트 테스트
  - `ScheduleCountdown.test.tsx` - 스케줄 카운트다운 컴포넌트

## 🔧 테스트 커버리지 목표

현재 설정된 커버리지 임계값:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## 📚 주요 테스트 케이스

### QStash 스케줄링 (`qstash.test.ts`)
- ✅ Daily 스케줄 다음 실행 시간 계산
- ✅ Weekly/Monthly 스케줄 계산
- ✅ Hourly/3hours/6hours 간격 계산
- ✅ 시간이 지난 경우 다음 주기 계산

### 스케줄 생성 API (`create.test.ts`)
- ✅ 정상적인 스케줄 생성
- ✅ 필수 필드 검증
- ✅ 다양한 빈도(hourly, daily 등) 처리

### 스케줄 업데이트 API (`update.test.ts`)
- ✅ 시간 변경 없는 업데이트
- ✅ 시간 변경 시 QStash 재스케줄링
- ✅ QStash 실패 시 graceful 처리
- ✅ 기존 메시지 취소 및 새 메시지 생성

### 콘텐츠 생성 API (`generate.test.ts`)
- ✅ 다양한 콘텐츠 타입 생성
- ✅ 필수 필드 검증
- ✅ API 오류 처리

### useSchedules 훅 (`useSchedules.test.tsx`)
- ✅ 스케줄 목록 가져오기
- ✅ 새 스케줄 생성
- ✅ 스케줄 업데이트 (QStash 포함)
- ✅ 스케줄 삭제
- ✅ 활성/비활성 토글

### ScheduleCountdown 컴포넌트
- ✅ 미래 스케줄 카운트다운 표시
- ✅ 지난 스케줄 표시
- ✅ 5분 이내 긴급 알림
- ✅ 매초 업데이트

## 🔍 TDD 워크플로우

1. **테스트 작성** (Red)
   ```typescript
   it('should create a new schedule', async () => {
     // 테스트 코드 작성
   })
   ```

2. **최소 구현** (Green)
   ```typescript
   // 테스트를 통과하는 최소한의 코드 작성
   ```

3. **리팩토링** (Refactor)
   ```typescript
   // 코드 개선 및 최적화
   ```

## 🐛 디버깅

```bash
# 특정 테스트 파일만 실행
npm test -- qstash.test.ts

# 특정 테스트 케이스만 실행
npm test -- --testNamePattern="should calculate next run"

# 디버그 모드로 실행
node --inspect-brk ./node_modules/.bin/jest --runInBand
```

## 📊 커버리지 리포트

```bash
# HTML 리포트 생성 및 열기
npm run test:coverage
open coverage/lcov-report/index.html
```

## 🚨 CI/CD 통합

GitHub Actions 또는 Vercel에서 자동 테스트:

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

## 💡 테스트 작성 팁

1. **Arrange-Act-Assert 패턴** 사용
2. **각 테스트는 독립적**으로 실행 가능해야 함
3. **Mock은 최소한**으로 사용
4. **실패하는 테스트를 먼저** 작성
5. **엣지 케이스** 잊지 말기

## 🔗 관련 문서

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [MSW (Mock Service Worker)](https://mswjs.io/)