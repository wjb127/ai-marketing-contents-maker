import { render, screen } from '@testing-library/react'
import { ScheduleCountdown } from '@/components/schedule/ScheduleCountdown'

describe('ScheduleCountdown Component', () => {
  beforeEach(() => {
    // Mock current time
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-08-08T10:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should display countdown for future schedule', () => {
    const nextRunAt = '2025-08-08T14:00:00Z' // 4 hours from now

    render(
      <ScheduleCountdown
        nextRunAt={nextRunAt}
        frequency="daily"
        timeOfDay="23:00"
        isActive={true}
      />
    )

    // Should show approximately 4 hours remaining
    expect(screen.getByText(/시간.*남음/)).toBeInTheDocument()
  })

  it('should show "지난 시간" for past schedule', () => {
    const nextRunAt = '2025-08-08T08:00:00Z' // 2 hours ago

    render(
      <ScheduleCountdown
        nextRunAt={nextRunAt}
        frequency="daily"
        timeOfDay="17:00"
        isActive={true}
      />
    )

    expect(screen.getByText('지난 시간')).toBeInTheDocument()
    expect(screen.getByText(/다음 실행 시간이 지났습니다/)).toBeInTheDocument()
  })

  it('should show "비활성" badge for inactive schedule', () => {
    const nextRunAt = '2025-08-08T14:00:00Z'

    render(
      <ScheduleCountdown
        nextRunAt={nextRunAt}
        frequency="daily"
        timeOfDay="23:00"
        isActive={false}
      />
    )

    expect(screen.getByText('비활성')).toBeInTheDocument()
  })

  it('should show urgent badge for schedules within 5 minutes', () => {
    const nextRunAt = '2025-08-08T10:04:00Z' // 4 minutes from now

    render(
      <ScheduleCountdown
        nextRunAt={nextRunAt}
        frequency="hourly"
        timeOfDay="00:00"
        isActive={true}
      />
    )

    expect(screen.getByText('5분 이내')).toBeInTheDocument()
    
    // Check for pulse animation class
    const badge = screen.getByText('5분 이내')
    expect(badge.parentElement).toHaveStyle({
      animation: expect.stringContaining('pulse'),
    })
  })

  it('should update countdown every second', () => {
    const nextRunAt = '2025-08-08T10:01:00Z' // 1 minute from now

    const { rerender } = render(
      <ScheduleCountdown
        nextRunAt={nextRunAt}
        frequency="hourly"
        timeOfDay="00:00"
        isActive={true}
      />
    )

    expect(screen.getByText(/1분.*0초.*남음/)).toBeInTheDocument()

    // Advance time by 30 seconds
    jest.advanceTimersByTime(30000)
    
    rerender(
      <ScheduleCountdown
        nextRunAt={nextRunAt}
        frequency="hourly"
        timeOfDay="00:00"
        isActive={true}
      />
    )

    // Should now show 30 seconds remaining
    expect(screen.getByText(/30초.*남음/)).toBeInTheDocument()
  })

  it('should format time correctly for different frequencies', () => {
    const frequencies = ['daily', 'weekly', 'monthly', 'hourly', '3hours', '6hours'] as const

    frequencies.forEach(frequency => {
      const { unmount } = render(
        <ScheduleCountdown
          nextRunAt="2025-08-09T10:00:00Z"
          frequency={frequency}
          timeOfDay="19:00"
          isActive={true}
        />
      )

      // Should display formatted next run time
      expect(screen.getByText(/다음 실행:/)).toBeInTheDocument()
      expect(screen.getByText(/KST/)).toBeInTheDocument()

      unmount()
    })
  })
})