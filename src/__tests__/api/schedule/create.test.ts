import { NextRequest } from 'next/server'
import { POST } from '@/app/api/schedule/create/route'

// Mock Supabase
jest.mock('@/lib/supabase-server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'test-schedule-id',
          name: 'Test Schedule',
          frequency: 'daily',
          time_of_day: '14:00:00',
          next_run_at: '2025-08-08T05:00:00.000Z',
        },
        error: null,
      }),
    })),
  })),
}))

// Mock QStash
jest.mock('@/lib/qstash', () => ({
  calculateNextRun: jest.fn(() => new Date('2025-08-08T05:00:00.000Z')),
  scheduleContentGeneration: jest.fn(() => Promise.resolve('test-message-id')),
}))

describe('POST /api/schedule/create', () => {
  it('should create a schedule successfully', async () => {
    const scheduleData = {
      name: 'Test Schedule',
      content_type: 'x_post',
      content_tone: 'professional',
      topic: 'Test Topic',
      target_audience: 'Developers',
      frequency: 'daily',
      time_of_day: '14:00',
      timezone: 'Asia/Seoul',
    }

    const request = new NextRequest('http://localhost:3000/api/schedule/create', {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('id', 'test-schedule-id')
    expect(data).toHaveProperty('name', 'Test Schedule')
    expect(data).toHaveProperty('next_run_at')
  })

  it('should return 400 if required fields are missing', async () => {
    const incompleteData = {
      name: 'Test Schedule',
      // Missing required fields
    }

    const request = new NextRequest('http://localhost:3000/api/schedule/create', {
      method: 'POST',
      body: JSON.stringify(incompleteData),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error', 'Missing required fields')
  })

  it('should handle hourly frequency correctly', async () => {
    const scheduleData = {
      name: 'Hourly Schedule',
      content_type: 'x_post',
      content_tone: 'casual',
      topic: 'Updates',
      frequency: 'hourly',
      time_of_day: '00:00',
      timezone: 'Asia/Seoul',
    }

    const request = new NextRequest('http://localhost:3000/api/schedule/create', {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('frequency', 'hourly')
  })
})