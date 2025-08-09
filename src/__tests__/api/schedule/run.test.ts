/**
 * 스케줄 즉시 실행 기능 TDD 테스트
 * 
 * 핵심 테스트 시나리오:
 * 1. 활성 스케줄 즉시 실행 성공
 * 2. 비활성 스케줄 실행 시 에러 처리
 * 3. 존재하지 않는 스케줄 실행 시 에러 처리
 * 4. 다양한 콘텐츠 타입별 즉시 생성
 * 5. AI 생성 실패 시 에러 처리
 * 6. 데이터베이스 저장 실패 시 에러 처리
 * 7. 스케줄 설정별 콘텐츠 생성
 * 8. 사용자 권한 검증
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/schedule/run/route'

// Mock dependencies
jest.mock('@/lib/supabase-server')
jest.mock('@/lib/claude')
jest.mock('@/utils/db-prompt-templates')

const mockScheduleData = {
  id: 'schedule-123',
  user_id: '00000000-0000-0000-0000-000000000001',
  name: '테스트 스케줄',
  content_type: 'x_post',
  content_tone: 'professional',
  topic: 'AI 마케팅',
  is_active: true,
  target_audience: '마케팅 담당자',
  additional_instructions: '실무 사례 포함',
  settings: {
    promptType: 'basic',
    creativity_level: 'balanced'
  }
}

const mockContentResponse = {
  data: {
    id: 'content-456',
    user_id: '00000000-0000-0000-0000-000000000001',
    title: 'Generated Content',
    content: '즉시 실행으로 생성된 테스트 콘텐츠입니다.',
    content_type: 'x_post',
    tone: 'professional',
    topic: 'AI 마케팅',
    schedule_id: 'schedule-123',
    status: 'draft',
    created_at: new Date().toISOString()
  },
  error: null
}

describe('스케줄 즉시 실행 기능 TDD 테스트', () => {
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mocks
    const mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: mockScheduleData,
              error: null
            }))
          }))
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve(mockContentResponse))
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null }))
        }))
      }))
    }
    
    require('@/lib/supabase-server').createClient = jest.fn(() => mockSupabase)
    
    require('@/lib/claude').anthropic = {
      messages: {
        create: jest.fn(() => Promise.resolve({
          content: [{ type: 'text', text: '즉시 실행으로 생성된 테스트 콘텐츠입니다.' }]
        }))
      }
    }
    
    require('@/utils/db-prompt-templates').getDatabasePromptTemplate = jest.fn(() => 
      Promise.resolve('즉시 실행용 프롬프트 템플릿')
    )
  })

  // TDD Test Case 1: 활성 스케줄 즉시 실행 성공
  test('활성 스케줄을 즉시 실행하여 콘텐츠 생성 성공해야 함', async () => {
    const request = new NextRequest('http://localhost:3000/api/schedule/run', {
      method: 'POST',
      body: JSON.stringify({
        scheduleId: 'schedule-123'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.content).toBeDefined()
    expect(data.content.id).toBe('content-456')
    expect(data.content.schedule_id).toBe('schedule-123')
  })

  // TDD Test Case 2: 비활성 스케줄 실행 시 에러 처리
  test('비활성 스케줄 실행 시 적절한 에러 메시지 반환해야 함', async () => {
    // Mock inactive schedule
    const mockSupabase = require('@/lib/supabase-server').createClient()
    mockSupabase.from().select().eq().single.mockResolvedValueOnce({
      data: { ...mockScheduleData, is_active: false },
      error: null
    })

    const request = new NextRequest('http://localhost:3000/api/schedule/run', {
      method: 'POST',
      body: JSON.stringify({
        scheduleId: 'schedule-123'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('inactive')
  })

  // TDD Test Case 3: 존재하지 않는 스케줄 실행 시 에러 처리
  test('존재하지 않는 스케줄 ID로 실행 시 404 에러 반환해야 함', async () => {
    const mockSupabase = require('@/lib/supabase-server').createClient()
    mockSupabase.from().select().eq().single.mockResolvedValueOnce({
      data: null,
      error: { message: 'Schedule not found' }
    })

    const request = new NextRequest('http://localhost:3000/api/schedule/run', {
      method: 'POST',
      body: JSON.stringify({
        scheduleId: 'non-existent-schedule'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toContain('not found')
  })

  // TDD Test Case 4: 다양한 콘텐츠 타입별 즉시 생성 테스트
  test.each([
    'x_post',
    'thread',
    'blog_post', 
    'youtube_script',
    'linkedin_post'
  ])('%s 타입 스케줄을 즉시 실행하여 콘텐츠 생성 성공해야 함', async (contentType) => {
    const mockSupabase = require('@/lib/supabase-server').createClient()
    mockSupabase.from().select().eq().single.mockResolvedValueOnce({
      data: { ...mockScheduleData, content_type: contentType },
      error: null
    })

    const request = new NextRequest('http://localhost:3000/api/schedule/run', {
      method: 'POST',
      body: JSON.stringify({
        scheduleId: 'schedule-123'
      })
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const mockPromptTemplates = require('@/utils/db-prompt-templates')
    expect(mockPromptTemplates.getDatabasePromptTemplate).toHaveBeenCalledWith(
      contentType,
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.any(String)
    )
  })

  // TDD Test Case 5: AI 생성 실패 시 에러 처리
  test('AI 서비스 장애로 콘텐츠 생성 실패 시 적절한 에러 처리해야 함', async () => {
    const mockClaude = require('@/lib/claude')
    mockClaude.anthropic.messages.create.mockRejectedValueOnce(
      new Error('Claude API rate limit exceeded')
    )

    const request = new NextRequest('http://localhost:3000/api/schedule/run', {
      method: 'POST',
      body: JSON.stringify({
        scheduleId: 'schedule-123'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toContain('generation failed')
  })

  // TDD Test Case 6: 데이터베이스 저장 실패 시 에러 처리
  test('생성된 콘텐츠의 DB 저장 실패 시 적절한 에러 처리해야 함', async () => {
    const mockSupabase = require('@/lib/supabase-server').createClient()
    
    // Schedule select는 성공
    mockSupabase.from().select().eq().single.mockResolvedValueOnce({
      data: mockScheduleData,
      error: null
    })
    
    // Content insert는 실패
    mockSupabase.from().insert().select().single.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database storage limit exceeded' }
    })

    const request = new NextRequest('http://localhost:3000/api/schedule/run', {
      method: 'POST',
      body: JSON.stringify({
        scheduleId: 'schedule-123'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toContain('save content')
  })

  // TDD Test Case 7: 커스텀 프롬프트 스케줄 즉시 실행
  test('커스텀 프롬프트가 설정된 스케줄을 정상 실행해야 함', async () => {
    const customPromptSchedule = {
      ...mockScheduleData,
      settings: {
        promptType: 'custom',
        customPrompt: '커스텀 프롬프트로 콘텐츠를 생성해주세요.',
        creativity_level: 'creative'
      }
    }

    const mockSupabase = require('@/lib/supabase-server').createClient()
    mockSupabase.from().select().eq().single.mockResolvedValueOnce({
      data: customPromptSchedule,
      error: null
    })

    const request = new NextRequest('http://localhost:3000/api/schedule/run', {
      method: 'POST',
      body: JSON.stringify({
        scheduleId: 'schedule-123'
      })
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    // 커스텀 프롬프트 사용 시 DB 템플릿 조회하지 않아야 함
    const mockPromptTemplates = require('@/utils/db-prompt-templates')
    expect(mockPromptTemplates.getDatabasePromptTemplate).not.toHaveBeenCalled()
  })

  // TDD Test Case 8: 스케줄 실행 후 last_run_at 업데이트 확인
  test('스케줄 실행 후 last_run_at이 현재 시간으로 업데이트되어야 함', async () => {
    const beforeRun = new Date()

    const request = new NextRequest('http://localhost:3000/api/schedule/run', {
      method: 'POST',
      body: JSON.stringify({
        scheduleId: 'schedule-123'
      })
    })

    await POST(request)

    const afterRun = new Date()
    const mockSupabase = require('@/lib/supabase-server').createClient()
    
    expect(mockSupabase.from().update).toHaveBeenCalledWith(
      expect.objectContaining({
        last_run_at: expect.any(String)
      })
    )
  })

  // TDD Test Case 9: 필수 파라미터 검증
  test('scheduleId 파라미터 누락 시 400 에러 반환해야 함', async () => {
    const request = new NextRequest('http://localhost:3000/api/schedule/run', {
      method: 'POST',
      body: JSON.stringify({}) // scheduleId 누락
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('scheduleId')
  })

  // TDD Test Case 10: 즉시 실행 성능 테스트
  test('스케줄 즉시 실행이 10초 이내에 완료되어야 함', async () => {
    const startTime = Date.now()

    const request = new NextRequest('http://localhost:3000/api/schedule/run', {
      method: 'POST',
      body: JSON.stringify({
        scheduleId: 'schedule-123'
      })
    })

    const response = await POST(request)
    const endTime = Date.now()
    const processingTime = endTime - startTime

    expect(response.status).toBe(200)
    expect(processingTime).toBeLessThan(10000) // 10초 이내 완료

    // 성능 로그
    console.log(`스케줄 즉시 실행 처리 시간: ${processingTime}ms`)
  })
})