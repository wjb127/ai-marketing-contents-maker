import { Client } from '@upstash/qstash'

// QStash client singleton
export const qstash = process.env.QSTASH_TOKEN ? new Client({
  token: process.env.QSTASH_TOKEN!,
}) : null

// 반복 스케줄 생성 (QStash Schedules 사용)
export async function createRecurringSchedule(
  scheduleId: string,
  frequency: 'daily' | 'weekly' | 'monthly' | 'hourly' | '3hours' | '6hours',
  timeOfDay: string, // HH:mm format
  timezone: string = 'Asia/Seoul'
) {
  if (!qstash) {
    throw new Error('QStash is not configured')
  }

  const url = `${process.env.NEXT_PUBLIC_URL?.trim()}/api/content/generate-scheduled`
  
  // Cron 표현식 생성
  const [hours, minutes] = timeOfDay.split(':').map(Number)
  let cron = ''
  
  switch (frequency) {
    case 'hourly':
      cron = `${minutes} * * * *` // 매시 X분
      break
    case '3hours':
      cron = `${minutes} */3 * * *` // 3시간마다 X분
      break
    case '6hours':
      cron = `${minutes} */6 * * *` // 6시간마다 X분
      break
    case 'daily':
      // 한국 시간(KST)을 UTC로 변환: KST는 UTC+9이므로 9시간 빼야 함
      const utcHours = (hours - 9 + 24) % 24
      cron = `${minutes} ${utcHours} * * *` // 매일 특정 시간 (UTC)
      break
    case 'weekly':
      const utcHoursWeekly = (hours - 9 + 24) % 24
      cron = `${minutes} ${utcHoursWeekly} * * 1` // 매주 월요일 (UTC)
      break
    case 'monthly':
      const utcHoursMonthly = (hours - 9 + 24) % 24
      cron = `${minutes} ${utcHoursMonthly} 1 * *` // 매월 1일 (UTC)
      break
    default:
      throw new Error(`Unsupported frequency: ${frequency}`)
  }

  console.log('🕐 Creating QStash schedule:', {
    scheduleId,
    cron,
    url,
    timeOfDay: `${timeOfDay} KST`,
    timeOfDayUTC: `${String(Math.floor((hours - 9 + 24) % 24)).padStart(2, '0')}:${String(minutes).padStart(2, '0')} UTC`,
    frequency,
    kstHours: hours,
    utcHours: (hours - 9 + 24) % 24
  })

  try {
    // QStash Schedules API 사용 (timezone을 cron 표현식으로 직접 처리)
    const response = await qstash.schedules.create({
      destination: url,
      cron,
      body: JSON.stringify({
        scheduleId,
        type: 'recurring'
      }),
      headers: {
        'Content-Type': 'application/json'
      },
      retries: 3
    })

    console.log('✅ QStash schedule created:', response)
    return response.scheduleId // Schedules API는 scheduleId 반환
    
  } catch (error: any) {
    console.error('❌ Failed to create QStash schedule:', error)
    throw error
  }
}

// 스케줄 삭제
export async function deleteSchedule(qstashScheduleId: string) {
  if (!qstash || !qstashScheduleId) {
    return false
  }

  try {
    await qstash.schedules.delete(qstashScheduleId)
    console.log('✅ QStash schedule deleted:', qstashScheduleId)
    return true
  } catch (error) {
    console.error('❌ Failed to delete schedule:', error)
    return false
  }
}

// 스케줄 목록 조회
export async function listSchedules() {
  if (!qstash) {
    return []
  }

  try {
    const schedules = await qstash.schedules.list()
    console.log('📋 QStash schedules:', schedules)
    return schedules
  } catch (error) {
    console.error('❌ Failed to list schedules:', error)
    return []
  }
}

// 스케줄 일시정지/재개
export async function pauseSchedule(qstashScheduleId: string) {
  if (!qstash) return false
  
  try {
    await qstash.schedules.pause(qstashScheduleId)
    console.log('⏸️ Schedule paused:', qstashScheduleId)
    return true
  } catch (error) {
    console.error('Failed to pause schedule:', error)
    return false
  }
}

export async function resumeSchedule(qstashScheduleId: string) {
  if (!qstash) return false
  
  try {
    await qstash.schedules.resume(qstashScheduleId)
    console.log('▶️ Schedule resumed:', qstashScheduleId)
    return true
  } catch (error) {
    console.error('Failed to resume schedule:', error)
    return false
  }
}

// 콘텐츠 생성 스케줄링 (일회성 + 반복)
export async function scheduleContentGeneration(
  scheduleId: string,
  nextRun: Date,
  existingMessageId?: string | null
) {
  if (!qstash) {
    throw new Error('QStash is not configured')
  }

  const url = `${process.env.NEXT_PUBLIC_URL?.trim()}/api/content/generate-scheduled`
  
  try {
    // 기존 스케줄이 있으면 삭제
    if (existingMessageId) {
      try {
        await qstash.schedules.delete(existingMessageId)
        console.log('🗑️ Deleted existing schedule:', existingMessageId)
      } catch (error) {
        console.log('⚠️ Failed to delete existing schedule, continuing...')
      }
    }

    // 새로운 일회성 스케줄 생성
    const response = await qstash.publishJSON({
      url,
      body: {
        scheduleId,
        type: 'single'
      },
      delay: Math.max(0, nextRun.getTime() - Date.now()), // 밀리초 단위 지연
      retries: 3
    })

    console.log('✅ Content generation scheduled:', {
      scheduleId,
      nextRun: nextRun.toISOString(),
      messageId: response.messageId
    })

    return response.messageId
  } catch (error: any) {
    console.error('❌ Failed to schedule content generation:', error)
    throw error
  }
}

// 다음 실행 시간 계산
export function calculateNextRun(
  frequency: 'daily' | 'weekly' | 'monthly' | 'hourly' | '3hours' | '6hours',
  timeOfDay: string, // HH:mm format
  timezone: string = 'Asia/Seoul'
): Date {
  const now = new Date()
  const [hours, minutes] = timeOfDay.split(':').map(Number)
  
  let nextRun = new Date()
  nextRun.setSeconds(0, 0) // 초, 밀리초 초기화
  
  switch (frequency) {
    case 'hourly':
      nextRun.setMinutes(minutes)
      // 이번 시간이 지났으면 다음 시간으로
      if (nextRun <= now) {
        nextRun.setHours(nextRun.getHours() + 1)
      }
      break
      
    case '3hours':
      nextRun.setMinutes(minutes)
      const currentHour3 = nextRun.getHours()
      const next3HourSlot = Math.ceil(currentHour3 / 3) * 3
      nextRun.setHours(next3HourSlot)
      if (nextRun <= now) {
        nextRun.setHours(nextRun.getHours() + 3)
      }
      break
      
    case '6hours':
      nextRun.setMinutes(minutes)
      const currentHour6 = nextRun.getHours()
      const next6HourSlot = Math.ceil(currentHour6 / 6) * 6
      nextRun.setHours(next6HourSlot)
      if (nextRun <= now) {
        nextRun.setHours(nextRun.getHours() + 6)
      }
      break
      
    case 'daily':
      nextRun.setHours(hours, minutes)
      // 오늘 시간이 지났으면 내일로
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1)
      }
      break
      
    case 'weekly':
      nextRun.setHours(hours, minutes)
      // 다음 월요일로 설정 (1 = 월요일)
      const daysUntilMonday = (8 - nextRun.getDay()) % 7 || 7
      nextRun.setDate(nextRun.getDate() + daysUntilMonday)
      break
      
    case 'monthly':
      nextRun.setHours(hours, minutes)
      nextRun.setDate(1) // 다음 달 1일
      nextRun.setMonth(nextRun.getMonth() + 1)
      break
      
    default:
      throw new Error(`Unsupported frequency: ${frequency}`)
  }
  
  console.log('📅 Next run calculated:', {
    frequency,
    timeOfDay,
    nextRun: nextRun.toISOString()
  })
  
  return nextRun
}

// 스케줄 취소 (이전 v1 호환성을 위해)
export async function cancelScheduledGeneration(messageId: string | null) {
  if (!qstash || !messageId) {
    return false
  }

  try {
    await qstash.schedules.delete(messageId)
    console.log('✅ Scheduled generation cancelled:', messageId)
    return true
  } catch (error) {
    console.error('❌ Failed to cancel scheduled generation:', error)
    return false
  }
}

// QStash 설정 확인
export function isQStashConfigured(): boolean {
  return qstash !== null
}