import { NextRequest } from 'next/server'
import { PUT } from '@/app/api/schedule/update/route'

// Mock Supabase
const mockSchedule = {
  id: 'test-schedule-id',
  name: 'Original Schedule',
  frequency: 'daily',
  time_of_day: '14:00:00',
  qstash_message_id: 'old-message-id',
  next_run_at: '2025-08-08T05:00:00.000Z',
}

jest.mock('@/lib/supabase-server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockSchedule,
        error: null,
      }),
    })),
  })),
}))

// Mock QStash
jest.mock('@/lib/qstash', () => ({
  calculateNextRun: jest.fn(() => new Date('2025-08-09T06:00:00.000Z')),
  scheduleContentGeneration: jest.fn(() => Promise.resolve('new-message-id')),
  cancelScheduledGeneration: jest.fn(() => Promise.resolve(true)),
}))

describe('PUT /api/schedule/update', () => {
  it('should update schedule without time changes', async () => {
    const updateData = {
      id: 'test-schedule-id',
      name: 'Updated Schedule Name',
      topic: 'Updated Topic',
    }

    const request = new NextRequest('http://localhost:3000/api/schedule/update', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('schedule_updated', false)
    expect(data).toHaveProperty('qstash_updated', false)
  })

  it('should update schedule with time changes and reschedule QStash', async () => {
    const updateData = {
      id: 'test-schedule-id',
      time_of_day: '15:00', // Changed time
      frequency: 'weekly', // Changed frequency
    }

    const request = new NextRequest('http://localhost:3000/api/schedule/update', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('schedule_updated', true)
    
    // Verify QStash functions were called
    const { cancelScheduledGeneration, scheduleContentGeneration } = require('@/lib/qstash')
    expect(cancelScheduledGeneration).toHaveBeenCalledWith('old-message-id')
    expect(scheduleContentGeneration).toHaveBeenCalled()
  })

  it('should return 400 if schedule ID is missing', async () => {
    const updateData = {
      name: 'Updated Schedule',
      // Missing id
    }

    const request = new NextRequest('http://localhost:3000/api/schedule/update', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error', 'Schedule ID is required')
  })

  it('should handle QStash failure gracefully', async () => {
    // Mock QStash to fail
    const { scheduleContentGeneration } = require('@/lib/qstash')
    ;(scheduleContentGeneration as jest.Mock).mockRejectedValueOnce(new Error('QStash error'))

    const updateData = {
      id: 'test-schedule-id',
      time_of_day: '16:00', // Changed time to trigger QStash update
    }

    const request = new NextRequest('http://localhost:3000/api/schedule/update', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    })

    const response = await PUT(request)
    const data = await response.json()

    // Should still succeed even if QStash fails
    expect(response.status).toBe(200)
    expect(data).toHaveProperty('schedule_updated', true)
    expect(data).toHaveProperty('qstash_updated', false)
  })
})