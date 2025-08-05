import { NextResponse } from 'next/server'

const schemaData = {
  tables: [
    {
      name: 'users',
      description: '사용자 정보 및 구독 관리',
      columns: [
        { name: 'id', type: 'UUID', primaryKey: true, description: 'auth.users 참조' },
        { name: 'email', type: 'TEXT', nullable: false, description: '이메일 주소' },
        { name: 'name', type: 'TEXT', nullable: true, description: '사용자 이름' },
        { name: 'avatar_url', type: 'TEXT', nullable: true, description: '프로필 이미지 URL' },
        { name: 'subscription_plan', type: 'subscription_plan_type', default: 'free', description: '구독 플랜: free, pro, premium' },
        { name: 'subscription_status', type: 'subscription_status_type', default: 'active', description: '구독 상태: active, canceled, expired, trialing' },
        { name: 'subscription_end_date', type: 'TIMESTAMP WITH TIME ZONE', nullable: true, description: '구독 종료일' },
        { name: 'toss_customer_id', type: 'TEXT', nullable: true, description: '토스페이먼츠 고객 ID' },
        { name: 'monthly_content_count', type: 'INTEGER', default: '0', description: '월간 콘텐츠 생성 횟수' },
        { name: 'monthly_reset_date', type: 'TIMESTAMP WITH TIME ZONE', default: 'NOW()', description: '월간 카운트 리셋 날짜' },
        { name: 'created_at', type: 'TIMESTAMP WITH TIME ZONE', default: 'NOW()', description: '생성일' },
        { name: 'updated_at', type: 'TIMESTAMP WITH TIME ZONE', default: 'NOW()', description: '수정일' }
      ],
      relationships: [
        { type: 'references', table: 'auth.users', column: 'id', description: 'Supabase Auth 시스템과 연결' }
      ]
    },
    {
      name: 'contents',
      description: 'AI로 생성된 콘텐츠 저장',
      columns: [
        { name: 'id', type: 'UUID', primaryKey: true, description: '콘텐츠 고유 ID' },
        { name: 'user_id', type: 'UUID', nullable: false, description: '사용자 ID (users 테이블 참조)' },
        { name: 'title', type: 'TEXT', nullable: false, description: '콘텐츠 제목' },
        { name: 'content', type: 'TEXT', nullable: false, description: '콘텐츠 본문' },
        { name: 'content_type', type: 'content_type_enum', nullable: false, description: '콘텐츠 타입: thread, x_post, blog_post 등' },
        { name: 'tone', type: 'content_tone_enum', nullable: false, description: '톤: professional, casual, humorous 등' },
        { name: 'status', type: 'content_status_enum', default: 'draft', description: '상태: draft, scheduled, published, archived' },
        { name: 'topic', type: 'TEXT', nullable: false, description: '주제' },
        { name: 'tags', type: 'TEXT[]', default: '{}', description: '태그 배열' },
        { name: 'word_count', type: 'INTEGER', nullable: true, description: '단어 수' },
        { name: 'estimated_read_time', type: 'INTEGER', nullable: true, description: '예상 읽기 시간(분)' },
        { name: 'scheduled_at', type: 'TIMESTAMP WITH TIME ZONE', nullable: true, description: '예약 발행 시간' },
        { name: 'published_at', type: 'TIMESTAMP WITH TIME ZONE', nullable: true, description: '발행 시간' },
        { name: 'auto_generated', type: 'BOOLEAN', default: 'FALSE', description: '자동 생성 여부' },
        { name: 'schedule_id', type: 'UUID', nullable: true, description: '스케줄 ID (schedules 테이블 참조)' },
        { name: 'metadata', type: 'JSONB', default: '{}', description: '메타데이터' },
        { name: 'ai_rating', type: 'DECIMAL(2,1)', nullable: true, description: 'AI 평가 점수 (1.0-5.0)' },
        { name: 'ai_feedback', type: 'TEXT', nullable: true, description: 'AI 피드백' },
        { name: 'ai_evaluation_criteria', type: 'JSONB', default: '{}', description: 'AI 평가 세부 기준' },
        { name: 'evaluated_at', type: 'TIMESTAMP WITH TIME ZONE', nullable: true, description: '평가 일시' },
        { name: 'evaluation_model', type: 'TEXT', nullable: true, description: '평가에 사용된 AI 모델' },
        { name: 'created_at', type: 'TIMESTAMP WITH TIME ZONE', default: 'NOW()', description: '생성일' },
        { name: 'updated_at', type: 'TIMESTAMP WITH TIME ZONE', default: 'NOW()', description: '수정일' }
      ],
      relationships: [
        { type: 'foreign_key', table: 'users', column: 'user_id', description: '콘텐츠 소유자' },
        { type: 'foreign_key', table: 'schedules', column: 'schedule_id', description: '관련 스케줄 (선택사항)' }
      ]
    },
    {
      name: 'schedules',
      description: '콘텐츠 자동 생성 스케줄',
      columns: [
        { name: 'id', type: 'UUID', primaryKey: true, description: '스케줄 고유 ID' },
        { name: 'user_id', type: 'UUID', nullable: false, description: '사용자 ID (users 테이블 참조)' },
        { name: 'name', type: 'TEXT', nullable: false, description: '스케줄 이름' },
        { name: 'content_type', type: 'content_type_enum', nullable: false, description: '생성할 콘텐츠 타입' },
        { name: 'frequency', type: 'schedule_frequency_enum', nullable: false, description: '실행 주기: daily, weekly, bi_weekly, monthly' },
        { name: 'time', type: 'TIME', nullable: false, description: '실행 시간' },
        { name: 'timezone', type: 'TEXT', default: 'UTC', description: '시간대' },
        { name: 'topics', type: 'TEXT[]', nullable: false, description: '주제 목록' },
        { name: 'tone', type: 'content_tone_enum', nullable: false, description: '톤' },
        { name: 'is_active', type: 'BOOLEAN', default: 'TRUE', description: '활성화 여부' },
        { name: 'next_run_at', type: 'TIMESTAMP WITH TIME ZONE', nullable: true, description: '다음 실행 시간' },
        { name: 'last_run_at', type: 'TIMESTAMP WITH TIME ZONE', nullable: true, description: '마지막 실행 시간' },
        { name: 'total_generated', type: 'INTEGER', default: '0', description: '총 생성된 콘텐츠 수' },
        { name: 'settings', type: 'JSONB', default: '{}', description: '추가 설정' },
        { name: 'created_at', type: 'TIMESTAMP WITH TIME ZONE', default: 'NOW()', description: '생성일' },
        { name: 'updated_at', type: 'TIMESTAMP WITH TIME ZONE', default: 'NOW()', description: '수정일' }
      ],
      relationships: [
        { type: 'foreign_key', table: 'users', column: 'user_id', description: '스케줄 소유자' }
      ]
    },
    {
      name: 'payments',
      description: '결제 내역 추적',
      columns: [
        { name: 'id', type: 'UUID', primaryKey: true, description: '결제 고유 ID' },
        { name: 'user_id', type: 'UUID', nullable: false, description: '사용자 ID (users 테이블 참조)' },
        { name: 'toss_payment_key', type: 'TEXT', nullable: false, description: '토스페이먼츠 결제 키' },
        { name: 'toss_order_id', type: 'TEXT', nullable: false, description: '토스페이먼츠 주문 ID' },
        { name: 'amount', type: 'INTEGER', nullable: false, description: '결제 금액 (원)' },
        { name: 'plan_type', type: 'subscription_plan_type', nullable: false, description: '구매한 플랜' },
        { name: 'status', type: 'TEXT', nullable: false, description: '결제 상태' },
        { name: 'approved_at', type: 'TIMESTAMP WITH TIME ZONE', nullable: true, description: '결제 승인 시간' },
        { name: 'created_at', type: 'TIMESTAMP WITH TIME ZONE', default: 'NOW()', description: '생성일' }
      ],
      relationships: [
        { type: 'foreign_key', table: 'users', column: 'user_id', description: '결제자' }
      ]
    }
  ],
  enums: [
    {
      name: 'subscription_plan_type',
      values: ['free', 'pro', 'premium'],
      description: '구독 플랜 타입'
    },
    {
      name: 'subscription_status_type', 
      values: ['active', 'canceled', 'expired', 'trialing'],
      description: '구독 상태'
    },
    {
      name: 'content_type_enum',
      values: ['thread', 'x_post', 'blog_post', 'youtube_script', 'instagram_reel_script', 'linkedin_post', 'facebook_post'],
      description: '콘텐츠 타입'
    },
    {
      name: 'content_tone_enum',
      values: ['professional', 'casual', 'humorous', 'inspirational', 'educational', 'motivational'],
      description: '콘텐츠 톤'
    },
    {
      name: 'content_status_enum',
      values: ['draft', 'scheduled', 'published', 'archived'],
      description: '콘텐츠 상태'
    },
    {
      name: 'schedule_frequency_enum',
      values: ['daily', 'weekly', 'bi_weekly', 'monthly'],
      description: '스케줄 주기'
    }
  ],
  indexes: [
    { table: 'users', columns: ['subscription_plan'], description: '구독 플랜별 조회 최적화' },
    { table: 'users', columns: ['subscription_status'], description: '구독 상태별 조회 최적화' },
    { table: 'contents', columns: ['user_id'], description: '사용자별 콘텐츠 조회 최적화' },
    { table: 'contents', columns: ['status'], description: '콘텐츠 상태별 조회 최적화' },
    { table: 'contents', columns: ['content_type'], description: '콘텐츠 타입별 조회 최적화' },
    { table: 'contents', columns: ['created_at DESC'], description: '최신 콘텐츠 조회 최적화' },
    { table: 'schedules', columns: ['user_id'], description: '사용자별 스케줄 조회 최적화' },
    { table: 'schedules', columns: ['is_active'], description: '활성 스케줄 조회 최적화' },
    { table: 'schedules', columns: ['next_run_at'], description: '스케줄 실행 최적화 (is_active = TRUE 조건)' },
    { table: 'payments', columns: ['user_id'], description: '사용자별 결제 내역 조회 최적화' },
    { table: 'payments', columns: ['status'], description: '결제 상태별 조회 최적화' }
  ],
  functions: [
    {
      name: 'handle_new_user()',
      description: 'Supabase Auth에서 새 사용자 생성 시 users 테이블에 자동으로 프로필 생성',
      trigger: 'auth.users INSERT 후'
    },
    {
      name: 'reset_monthly_content_count()',
      description: '월간 콘텐츠 생성 횟수를 리셋 (배치 작업용)',
      parameters: 'void'
    },
    {
      name: 'check_content_limit(user_uuid UUID)',
      description: '사용자의 콘텐츠 생성 한도를 확인',
      returns: 'BOOLEAN'
    },
    {
      name: 'increment_content_count()',
      description: '새 콘텐츠 생성 시 월간 카운트 증가',
      trigger: 'contents INSERT 후'
    },
    {
      name: 'update_updated_at_column()',
      description: '레코드 업데이트 시 updated_at 자동 갱신',
      trigger: 'users, contents, schedules UPDATE 전'
    }
  ],
  rls_policies: [
    { table: 'users', description: '사용자는 자신의 프로필만 조회/수정 가능' },
    { table: 'contents', description: '사용자는 자신의 콘텐츠만 CRUD 가능' },
    { table: 'schedules', description: '사용자는 자신의 스케줄만 CRUD 가능' },
    { table: 'payments', description: '사용자는 자신의 결제 내역만 조회 가능' }
  ]
}

export async function GET() {
  try {
    return NextResponse.json(schemaData)
  } catch (error) {
    console.error('Schema API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schema data' },
      { status: 500 }
    )
  }
}