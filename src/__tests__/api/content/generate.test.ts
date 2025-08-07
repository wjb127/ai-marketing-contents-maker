import { NextRequest } from 'next/server'
import { POST } from '@/app/api/content/generate/route'

// Mock Anthropic
jest.mock('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ text: 'Generated test content' }],
      }),
    },
  })),
}))

// Mock Supabase
jest.mock('@/lib/supabase-server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'test-content-id',
          content: 'Generated test content',
          type: 'x_post',
        },
        error: null,
      }),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    })),
  })),
}))

describe('POST /api/content/generate', () => {
  it('should generate content successfully', async () => {
    const contentData = {
      type: 'x_post',
      tone: 'professional',
      topic: 'AI Development',
      targetAudience: 'Developers',
      additionalInstructions: 'Focus on practical tips',
    }

    const request = new NextRequest('http://localhost:3000/api/content/generate', {
      method: 'POST',
      body: JSON.stringify(contentData),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('id', 'test-content-id')
    expect(data).toHaveProperty('content', 'Generated test content')
    expect(data).toHaveProperty('type', 'x_post')
  })

  it('should validate required fields', async () => {
    const incompleteData = {
      type: 'x_post',
      // Missing tone and topic
    }

    const request = new NextRequest('http://localhost:3000/api/content/generate', {
      method: 'POST',
      body: JSON.stringify(incompleteData),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
  })

  it('should handle different content types', async () => {
    const contentTypes = ['x_post', 'thread', 'blog_post', 'youtube_script']

    for (const type of contentTypes) {
      const contentData = {
        type,
        tone: 'casual',
        topic: 'Test Topic',
      }

      const request = new NextRequest('http://localhost:3000/api/content/generate', {
        method: 'POST',
        body: JSON.stringify(contentData),
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
    }
  })

  it('should handle API errors gracefully', async () => {
    // Mock Anthropic to throw error
    const Anthropic = require('@anthropic-ai/sdk').default
    Anthropic.mockImplementationOnce(() => ({
      messages: {
        create: jest.fn().mockRejectedValue(new Error('API Error')),
      },
    }))

    const contentData = {
      type: 'x_post',
      tone: 'professional',
      topic: 'Test',
    }

    const request = new NextRequest('http://localhost:3000/api/content/generate', {
      method: 'POST',
      body: JSON.stringify(contentData),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toHaveProperty('error')
  })
})