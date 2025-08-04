# QStash 설정 가이드

## 1. QStash 계정 생성

1. https://console.upstash.com 접속
2. GitHub 또는 Google로 로그인
3. "QStash" 선택
4. 프로젝트 생성

## 2. API 키 발급

QStash Console에서 다음 정보 복사:

```
QSTASH_URL: https://qstash.upstash.io
QSTASH_TOKEN: qstash_xxx (Current Token)
QSTASH_CURRENT_SIGNING_KEY: sig_xxx
QSTASH_NEXT_SIGNING_KEY: sig_xxx
```

## 3. .env.local 업데이트

```env
# 기존 환경변수들...
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_key

# QStash 추가
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=your_qstash_token
QSTASH_CURRENT_SIGNING_KEY=your_current_signing_key
QSTASH_NEXT_SIGNING_KEY=your_next_signing_key

# 애플리케이션 URL (중요!)
NEXT_PUBLIC_URL=http://localhost:3000  # 개발용
# NEXT_PUBLIC_URL=https://your-app.vercel.app  # 프로덕션용
```

## 4. 무료 tier 한도

- **50만 메시지/월** 무료
- 대략 **16,000명 사용자**가 일일 1회씩 사용 가능
- 재시도 포함하면 **5,000명 정도 안전**

## 5. 확인 방법

환경변수 설정 후:
```bash
npm run dev
```

로그에서 "QStash configured" 메시지 확인