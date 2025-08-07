import { renderHook, act, waitFor } from '@testing-library/react'
import { useSchedules } from '@/hooks/useSchedules'
import { ReactNode } from 'react'

// Mock useAuth
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
  }),
}))

// Mock fetch
global.fetch = jest.fn()

const wrapper = ({ children }: { children: ReactNode }) => <>{children}</>

describe('useSchedules Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch schedules on mount', async () => {
    const mockSchedules = [
      {
        id: '1',
        name: 'Schedule 1',
        frequency: 'daily',
        time_of_day: '14:00',
        is_active: true,
      },
      {
        id: '2',
        name: 'Schedule 2',
        frequency: 'weekly',
        time_of_day: '10:00',
        is_active: false,
      },
    ]

    // Mock Supabase response
    const mockSupabase = require('@supabase/supabase-js').createClient()
    mockSupabase.from().select().eq().order.mockResolvedValue({
      data: mockSchedules,
      error: null,
    })

    const { result } = renderHook(() => useSchedules(), { wrapper })

    // Initially loading
    expect(result.current.loading).toBe(true)
    expect(result.current.schedules).toEqual([])

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.schedules).toEqual(mockSchedules)
    expect(result.current.error).toBeNull()
  })

  it('should create a new schedule', async () => {
    const newSchedule = {
      name: 'New Schedule',
      content_type: 'x_post' as const,
      content_tone: 'professional' as const,
      topic: 'AI',
      frequency: 'daily' as const,
      time_of_day: '15:00',
      timezone: 'Asia/Seoul',
    }

    const mockResponse = {
      id: 'new-schedule-id',
      ...newSchedule,
      next_run_at: '2025-08-08T06:00:00.000Z',
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    })

    const { result } = renderHook(() => useSchedules(), { wrapper })

    await act(async () => {
      const created = await result.current.createSchedule(newSchedule)
      expect(created).toEqual(mockResponse)
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/schedule/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSchedule),
    })
  })

  it('should update a schedule', async () => {
    const scheduleId = 'test-schedule-id'
    const updates = {
      name: 'Updated Name',
      time_of_day: '16:00',
    }

    const mockResponse = {
      id: scheduleId,
      ...updates,
      schedule_updated: true,
      qstash_updated: true,
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    })

    const { result } = renderHook(() => useSchedules(), { wrapper })

    await act(async () => {
      const updated = await result.current.updateSchedule(scheduleId, updates)
      expect(updated).toEqual(mockResponse)
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/schedule/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: scheduleId, ...updates }),
    })
  })

  it('should delete a schedule', async () => {
    const scheduleId = 'test-schedule-id'

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    })

    const { result } = renderHook(() => useSchedules(), { wrapper })

    // Set initial schedules
    act(() => {
      result.current.schedules = [
        { id: scheduleId, name: 'To Delete' } as any,
        { id: 'other-id', name: 'Keep This' } as any,
      ]
    })

    await act(async () => {
      await result.current.deleteSchedule(scheduleId)
    })

    expect(global.fetch).toHaveBeenCalledWith(
      `/api/schedule/delete?id=${scheduleId}`,
      { method: 'DELETE' }
    )

    // Schedule should be removed from state
    expect(result.current.schedules).toHaveLength(1)
    expect(result.current.schedules[0].id).toBe('other-id')
  })

  it('should toggle schedule active status', async () => {
    const scheduleId = 'test-schedule-id'

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: scheduleId,
        is_active: false,
      }),
    })

    const { result } = renderHook(() => useSchedules(), { wrapper })

    await act(async () => {
      await result.current.toggleSchedule(scheduleId, false)
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/schedule/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: scheduleId, is_active: false }),
    })
  })

  it('should handle errors properly', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useSchedules(), { wrapper })

    await expect(
      result.current.createSchedule({
        name: 'Test',
        content_type: 'x_post',
        content_tone: 'professional',
        topic: 'Test',
        frequency: 'daily',
        time_of_day: '14:00',
        timezone: 'Asia/Seoul',
      })
    ).rejects.toThrow('Network error')
  })
})