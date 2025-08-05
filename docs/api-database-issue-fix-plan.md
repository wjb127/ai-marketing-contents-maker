# API 및 데이터베이스 오류 해결 계획서

## 문제 분석

### 1. Next.js 15 cookies() API 오류
```
Error: Route "/api/content/generate" used `cookies().getAll()`. 
`cookies()` should be awaited before using its value.
```

**원인:**
- Next.js 15에서 `cookies()` API가 비동기 함수로 변경됨
- `supabase-server.ts`에서 동기적으로 `cookies().getAll()` 호출

**영향:**
- 개발 모드에서 반복적인 에러 메시지
- 성능 저하 및 불안정성

### 2. Database Schema 불일치 오류
```
Could not find the 'ai_evaluation_criteria' column of 'contents' in the schema cache
```

**원인:**
- 다른 개발자가 추가한 evaluation 기능에서 `ai_evaluation_criteria` 컬럼 참조
- 현재 데이터베이스에 해당 컬럼이 존재하지 않음

**영향:**
- 콘텐츠 생성은 성공하지만 평가 기능 실패
- 백그라운드 에러 발생

## 해결 방안

### Phase 1: Next.js 15 cookies() API 수정 (우선순위: 높음)

#### 현재 코드 (src/lib/supabase-server.ts)
```typescript
export function createClient() {
  const cookieStore = cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()  // ❌ 동기적 호출
        },
        // ...
      },
    }
  )
}
```

#### 수정 방안
```typescript
export async function createClient() {
  const cookieStore = await cookies()  // ✅ await 추가
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        // ...
      },
    }
  )
}
```

#### 연쇄 수정 필요한 파일들
1. `src/app/api/content/generate/route.ts`
2. `src/app/api/content/generate-scheduled/route.ts`
3. 기타 `createClient()` 사용하는 모든 API 라우트

### Phase 2: Database Schema 수정 (우선순위: 중간)

#### 옵션 A: 컬럼 추가 (권장)
```sql
ALTER TABLE contents 
ADD COLUMN ai_evaluation_criteria JSONB;
```

#### 옵션 B: Evaluation 기능 비활성화
```typescript
// 임시로 evaluation 기능 주석 처리
// try {
//   await evaluateAndSaveContent(contentData.id)
// } catch (evaluationError) {
//   // ...
// }
```

#### 옵션 C: 조건부 실행
```typescript
try {
  // 컬럼 존재 여부 확인 후 실행
  await checkColumnExists('contents', 'ai_evaluation_criteria')
  await evaluateAndSaveContent(contentData.id)
} catch (evaluationError) {
  console.log('Evaluation skipped:', evaluationError.message)
}
```

### Phase 3: 에러 핸들링 개선 (우선순위: 낮음)

#### 현재 문제점
- 에러가 발생해도 200 응답 반환
- 사용자에게 명확한 피드백 부재

#### 개선 방안
```typescript
export async function POST(request: NextRequest) {
  try {
    // 콘텐츠 생성
    const contentData = await generateContent(...)
    
    // 평가는 별도로 처리 (실패해도 콘텐츠 생성 성공)
    evaluateContentAsync(contentData.id).catch(error => {
      console.warn('Evaluation failed but content created:', error)
    })
    
    return NextResponse.json({
      ...contentData,
      evaluation_status: 'pending'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Content generation failed' },
      { status: 500 }
    )
  }
}
```

## 구현 순서

### 1단계: 즉시 수정 (30분)
- [ ] `supabase-server.ts`의 `cookies()` API 수정
- [ ] 모든 API 라우트에서 `await createClient()` 적용
- [ ] 빌드 테스트 및 동작 확인

### 2단계: 데이터베이스 처리 (15분)
- [ ] 옵션 선택: 컬럼 추가 vs 기능 비활성화
- [ ] 선택한 방법으로 구현
- [ ] 에러 없이 동작 확인

### 3단계: 에러 핸들링 개선 (선택사항)
- [ ] 비동기 평가 처리
- [ ] 사용자 피드백 개선
- [ ] 모니터링 로그 추가

## 예상 위험 요소

### 높은 위험
1. **Breaking Change**: `createClient()` 함수가 async가 되면서 기존 동기 코드 영향
2. **Type Error**: TypeScript에서 Promise 타입 불일치

### 중간 위험
1. **Database Migration**: 프로덕션 DB 스키마 변경
2. **기능 중단**: evaluation 기능 일시 비활성화

### 낮은 위험
1. **개발 환경**: 로컬에서만 발생하는 에러들

## 테스트 계획

### 1단계 테스트
1. 개발 서버 재시작
2. 콘텐츠 생성 페이지 접속
3. 새 콘텐츠 생성 시도
4. 터미널 에러 메시지 확인

### 2단계 테스트
1. 데이터베이스 스키마 확인
2. evaluation 기능 동작 테스트
3. 에러 로그 모니터링

## 권장 해결 순서

**즉시 실행 (5분):**
- cookies() API 수정으로 반복 에러 제거

**단기 해결 (15분):**
- evaluation 기능 임시 비활성화로 안정성 확보

**장기 해결 (필요시):**
- 데이터베이스 스키마 정비 및 evaluation 기능 복구

## 결론

현재 문제들은 모두 해결 가능하며, 콘텐츠 생성 기능 자체는 정상 동작하고 있습니다. 
우선순위에 따라 단계적으로 수정하면 안정적인 서비스를 제공할 수 있습니다.