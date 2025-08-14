# Supabase MCP 설정 가이드

## 설치 완료 ✅

Supabase MCP 서버가 성공적으로 설치되었습니다:

```bash
# 설치된 패키지
@supabase/mcp-server-supabase@0.4.5

# 설치 위치
/Users/seungbeenwi/.nvm/versions/node/v18.20.5/bin/mcp-server-supabase
```

## Claude Desktop 설정 방법

### 1. Claude Desktop 설정 파일 위치
Claude Desktop의 MCP 설정 파일은 다음 위치에 있습니다:

**macOS:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```
%APPDATA%/Claude/claude_desktop_config.json
```

### 2. 설정 파일 내용

Claude Desktop 설정 파일에 다음 내용을 추가하세요:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "mcp-server-supabase",
      "args": [],
      "env": {
        "SUPABASE_URL": "https://your-project-id.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key-here"
      }
    }
  }
}
```

### 3. 환경 변수 설정

**현재 프로젝트용 Supabase 정보:**
- URL: `NEXT_PUBLIC_SUPABASE_URL` 값 사용
- Service Role Key: `SUPABASE_SERVICE_ROLE_KEY` 값 사용

**설정 예시:**
```json
{
  "mcpServers": {
    "supabase": {
      "command": "mcp-server-supabase", 
      "args": [],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
  }
}
```

### 4. Claude Desktop 재시작

설정을 완료한 후:
1. Claude Desktop을 완전히 종료
2. Claude Desktop을 다시 시작
3. 새로운 대화에서 Supabase MCP 기능 사용 가능

## 사용 가능한 기능

Supabase MCP를 통해 다음 작업을 수행할 수 있습니다:

### 데이터베이스 작업
- 테이블 조회 (`SELECT`)
- 데이터 삽입 (`INSERT`)
- 데이터 업데이트 (`UPDATE`)
- 데이터 삭제 (`DELETE`)
- 스키마 정보 조회

### 인증 관리
- 사용자 목록 조회
- 사용자 생성/수정/삭제
- 세션 관리

### 스토리지 작업
- 파일 업로드/다운로드
- 버킷 관리
- 파일 목록 조회

## 사용 예시

Claude Desktop에서 다음과 같이 요청할 수 있습니다:

```
사용자 테이블에서 모든 사용자를 조회해줘
```

```
새로운 콘텐츠를 contents 테이블에 추가해줘
```

```
활성화된 스케줄 목록을 보여줘
```

## 주의사항

1. **Service Role Key 보안**: Service Role Key는 관리자 권한을 가지므로 안전하게 관리하세요
2. **환경별 설정**: 개발/스테이징/프로덕션 환경별로 다른 Supabase 프로젝트 사용 권장
3. **Claude Desktop 재시작**: 설정 변경 후 반드시 Claude Desktop 재시작 필요

## 문제 해결

### MCP 서버가 인식되지 않는 경우
1. Node.js 버전 확인 (18+ 권장)
2. `which mcp-server-supabase` 명령으로 설치 경로 확인
3. Claude Desktop 로그 확인

### 환경 변수 오류
1. Supabase URL 형식 확인 (`https://` 포함)
2. Service Role Key 정확성 확인
3. JSON 형식 유효성 검사

## 추가 리소스

- [Supabase MCP 공식 문서](https://github.com/supabase/mcp-server-supabase)
- [Model Context Protocol 문서](https://modelcontextprotocol.io/)
- [Claude Desktop MCP 가이드](https://docs.anthropic.com/claude/docs/desktop-app)

---

**설치 완료일**: 2025-08-09  
**버전**: @supabase/mcp-server-supabase@0.4.5  
**설치 위치**: `/Users/seungbeenwi/.nvm/versions/node/v18.20.5/bin/mcp-server-supabase`