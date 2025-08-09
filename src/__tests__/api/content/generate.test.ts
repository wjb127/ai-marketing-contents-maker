/**
 * 콘텐츠 생성 API TDD 테스트
 * 
 * 핵심 테스트 시나리오:
 * 1. 기본 콘텐츠 생성 성공
 * 2. 다양한 콘텐츠 타입별 생성  
 * 3. 다양한 톤별 콘텐츠 생성
 * 4. 창의성 레벨별 콘텐츠 생성
 * 5. 필수 파라미터 누락 시 에러 처리
 * 6. AI/DB 에러 상황 처리
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/content/generate/route'

// Mock dependencies
jest.mock('@/lib/supabase-server')
jest.mock('@/lib/claude') 
jest.mock('@/utils/db-prompt-templates')

const mockSupabaseResponse = {
  data: {
    id: 'content-123',
    user_id: '00000000-0000-0000-0000-000000000001',
    title: 'Generated Content',
    content: 'AI로 생성된 테스트 콘텐츠입니다.',
    type: 'x_post',
    tone: 'professional',
    topic: 'AI 마케팅',
    status: 'draft',
    created_at: new Date().toISOString()
  },
  error: null
}

const mockAnthropicResponse = {
  content: [{ type: 'text', text: 'AI로 생성된 테스트 콘텐츠입니다.' }]
}

describe('콘텐츠 생성 API TDD 테스트', () => {
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mocks
    require('@/lib/supabase-server').createClient = jest.fn(() => ({
      from: jest.fn(() => ({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve(mockSupabaseResponse))
          }))
        }))
      }))
    }))
    
    require('@/lib/claude').anthropic = {
      messages: {
        create: jest.fn(() => Promise.resolve(mockAnthropicResponse))
      }
    }
    
    require('@/utils/db-prompt-templates').getDatabasePromptTemplate = jest.fn(() => 
      Promise.resolve('테스트용 프롬프트 템플릿')
    )
  })

  // TDD Test Case 1: 기본 X 포스트 생성 성공
  test('기본 파라미터로 X 포스트 생성 성공해야 함', async () => {
    const contentData = {
      type: 'x_post',
      tone: 'professional',
      topic: 'AI 마케팅',
      creativityLevel: 'balanced'
    }

    const request = new NextRequest('http://localhost:3000/api/content/generate', {
      method: 'POST',
      body: JSON.stringify(contentData),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe('content-123')
    expect(data.type).toBe('x_post')
    expect(data.tone).toBe('professional')
  })

  // TDD Test Case 2: 다양한 콘텐츠 타입별 생성 테스트
  test.each([
    'x_post',
    'thread', 
    'blog_post',
    'youtube_script',
    'instagram_reel_script',
    'linkedin_post',
    'facebook_post'
  ])('%s 콘텐츠 타입 생성 성공해야 함', async (contentType) => {
    const request = new NextRequest('http://localhost:3000/api/content/generate', {
      method: 'POST',
      body: JSON.stringify({
        type: contentType,
        tone: 'casual',
        topic: '테스트 주제',
        creativityLevel: 'balanced'
      })
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
  })

  // TDD Test Case 3: 다양한 톤별 콘텐츠 생성 테스트
  test.each([
    'professional',
    'casual', 
    'humorous',
    'inspirational',
    'educational'
  ])('%s 톤으로 콘텐츠 생성 성공해야 함', async (tone) => {
    const request = new NextRequest('http://localhost:3000/api/content/generate', {
      method: 'POST',
      body: JSON.stringify({
        type: 'x_post',
        tone: tone,
        topic: '테스트 주제'
      })
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
  })

  // TDD Test Case 4: 창의성 레벨별 생성 테스트
  test.each([
    { level: 'conservative', expectedTemp: 0.1 },
    { level: 'balanced', expectedTemp: 0.7 },
    { level: 'creative', expectedTemp: 0.9 },
    { level: 'experimental', expectedTemp: 1.0 }
  ])('$level 창의성 레벨로 생성 시 온도 $expectedTemp 사용해야 함', async ({ level, expectedTemp }) => {
    const mockClaude = require('@/lib/claude')
    
    const request = new NextRequest('http://localhost:3000/api/content/generate', {
      method: 'POST',
      body: JSON.stringify({
        type: 'x_post',
        tone: 'casual',
        topic: '창의성 테스트',
        creativityLevel: level
      })
    })

    await POST(request)
    
    expect(mockClaude.anthropic.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        temperature: expectedTemp
      })
    )
  })

  // TDD Test Case 5: 필수 파라미터 누락 시 400 에러 반환
  test.each([
    { missing: 'type', params: { tone: 'casual', topic: '테스트' } },
    { missing: 'tone', params: { type: 'x_post', topic: '테스트' } },
    { missing: 'topic', params: { type: 'x_post', tone: 'casual' } }
  ])('$missing 파라미터 누락 시 400 에러 반환해야 함', async ({ params }) => {
    const request = new NextRequest('http://localhost:3000/api/content/generate', {
      method: 'POST',
      body: JSON.stringify(params)
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('required')
  })

  // TDD Test Case 6: AI 서비스 장애 시 에러 처리
  test('AI 서비스 장애 시 500 에러와 적절한 메시지 반환해야 함', async () => {
    const mockClaude = require('@/lib/claude')
    mockClaude.anthropic.messages.create.mockRejectedValueOnce(
      new Error('AI service temporarily unavailable')
    )

    const request = new NextRequest('http://localhost:3000/api/content/generate', {
      method: 'POST',
      body: JSON.stringify({
        type: 'x_post',
        tone: 'professional',
        topic: 'AI 장애 테스트'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to generate content')
  })

  // TDD Test Case 7: 데이터베이스 저장 실패 시 에러 처리
  test('데이터베이스 저장 실패 시 500 에러 반환해야 함', async () => {
    require('@/lib/supabase-server').createClient = jest.fn(() => ({
      from: jest.fn(() => ({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Database connection failed' }
            }))
          }))
        }))
      }))
    }))

    const request = new NextRequest('http://localhost:3000/api/content/generate', {
      method: 'POST',
      body: JSON.stringify({
        type: 'blog_post',
        tone: 'educational',
        topic: 'DB 저장 테스트'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to save generated content')
  })

  // TDD Test Case 8: 타겟 오디언스와 추가 요청사항 정상 처리
  test('타겟 오디언스와 추가 요청사항이 프롬프트에 반영되어야 함', async () => {
    const mockPromptTemplates = require('@/utils/db-prompt-templates')

    const request = new NextRequest('http://localhost:3000/api/content/generate', {
      method: 'POST',
      body: JSON.stringify({
        type: 'blog_post',
        tone: 'educational',
        topic: '스타트업 마케팅',
        target_audience: '초기 스타트업 창업자',
        additional_instructions: '구체적인 사례와 실행 가능한 팁 포함'
      })
    })

    await POST(request)

    expect(mockPromptTemplates.getDatabasePromptTemplate).toHaveBeenCalledWith(
      'blog_post',
      'educational', 
      '스타트업 마케팅',
      '초기 스타트업 창업자',
      '구체적인 사례와 실행 가능한 팁 포함'
    )
  })

  // TDD Test Case 9: 커스텀 온도/top_p 파라미터 우선 적용
  test('커스텀 temperature와 top_p 파라미터가 우선 적용되어야 함', async () => {
    const mockClaude = require('@/lib/claude')

    const request = new NextRequest('http://localhost:3000/api/content/generate', {
      method: 'POST',
      body: JSON.stringify({
        type: 'thread',
        tone: 'humorous',
        topic: '커스텀 파라미터 테스트',
        temperature: 0.8,
        top_p: 0.95
      })
    })

    await POST(request)

    expect(mockClaude.anthropic.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        temperature: 0.8,
        top_p: 0.95
      })
    )
  })

  // TDD Test Case 10: 복잡한 요청사항 처리 성능 테스트
  test('긴 주제명과 복잡한 요청사항을 정상 처리해야 함', async () => {
    const longTopic = 'B2B SaaS 스타트업을 위한 콘텐츠 마케팅 전략: 리드 제너레이션부터 고객 전환까지'
    const complexInstructions = '업계 통계 포함, 실제 사례 연구 3개 이상, 실행 가능한 체크리스트, 추천 도구 목록'

    const startTime = Date.now()
    
    const request = new NextRequest('http://localhost:3000/api/content/generate', {
      method: 'POST',
      body: JSON.stringify({
        type: 'blog_post',
        tone: 'professional',
        topic: longTopic,
        target_audience: 'B2B SaaS 마케팅 담당자',
        additional_instructions: complexInstructions
      })
    })

    const response = await POST(request)
    const endTime = Date.now()
    const processingTime = endTime - startTime

    expect(response.status).toBe(200)
    expect(processingTime).toBeLessThan(5000) // 5초 이내 응답
  })
})