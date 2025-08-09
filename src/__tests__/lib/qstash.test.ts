// Mock QStash dependencies to avoid import issues
jest.mock('@upstash/qstash', () => ({
  Client: jest.fn(),
}))

// Import after mocking
const { calculateNextRun } = require('@/lib/qstash')

describe('QStash Scheduling Functions', () => {
  describe('calculateNextRun', () => {
    beforeEach(() => {
      // Mock current time to 2025-08-08 10:00:00 KST
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2025-08-08T01:00:00Z')) // UTC (KST-9)
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should calculate next run for daily schedule', () => {
      const nextRun = calculateNextRun('daily', '14:00', 'Asia/Seoul')
      
      // Should be same day at 14:00 KST (05:00 UTC)
      expect(nextRun.toISOString()).toBe('2025-08-08T05:00:00.000Z')
    })

    it('should calculate next run for daily schedule when time has passed', () => {
      // Set time to 15:00 KST
      jest.setSystemTime(new Date('2025-08-08T06:00:00Z'))
      
      const nextRun = calculateNextRun('daily', '14:00', 'Asia/Seoul')
      
      // Should be next day at 14:00 KST
      expect(nextRun.toISOString()).toBe('2025-08-09T05:00:00.000Z')
    })

    it('should calculate next run for weekly schedule', () => {
      const nextRun = calculateNextRun('weekly', '14:00', 'Asia/Seoul')
      
      // Should be same day at 14:00 KST this week
      expect(nextRun.toISOString()).toBe('2025-08-08T05:00:00.000Z')
    })

    it('should calculate next run for monthly schedule', () => {
      const nextRun = calculateNextRun('monthly', '14:00', 'Asia/Seoul')
      
      // Should be same day at 14:00 KST this month
      expect(nextRun.toISOString()).toBe('2025-08-08T05:00:00.000Z')
    })

    it('should calculate next run for hourly schedule', () => {
      const nextRun = calculateNextRun('hourly', '00:00', 'Asia/Seoul')
      
      // Should be 1 hour from now
      const expected = new Date('2025-08-08T02:00:00Z')
      expect(nextRun.toISOString()).toBe(expected.toISOString())
    })

    it('should calculate next run for 3-hour interval', () => {
      const nextRun = calculateNextRun('3hours', '00:00', 'Asia/Seoul')
      
      // Should be 3 hours from now
      const expected = new Date('2025-08-08T04:00:00Z')
      expect(nextRun.toISOString()).toBe(expected.toISOString())
    })

    it('should calculate next run for 6-hour interval', () => {
      const nextRun = calculateNextRun('6hours', '00:00', 'Asia/Seoul')
      
      // Should be 6 hours from now
      const expected = new Date('2025-08-08T07:00:00Z')
      expect(nextRun.toISOString()).toBe(expected.toISOString())
    })
  })
})