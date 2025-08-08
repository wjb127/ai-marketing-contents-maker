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
      // UTC로 변환 (KST-9)
      const utcHours = (hours - 9 + 24) % 24
      cron = `${minutes} ${utcHours} * * *` // 매일 특정 시간
      break
    case 'weekly':
      const utcHoursWeekly = (hours - 9 + 24) % 24
      cron = `${minutes} ${utcHoursWeekly} * * 1` // 매주 월요일
      break
    case 'monthly':
      const utcHoursMonthly = (hours - 9 + 24) % 24
      cron = `${minutes} ${utcHoursMonthly} 1 * *` // 매월 1일
      break
    default:
      throw new Error(`Unsupported frequency: ${frequency}`)
  }

  console.log('🕐 Creating QStash schedule:', {
    scheduleId,
    cron,
    url,
    timeOfDay: `${timeOfDay} KST`,
    frequency
  })

  try {
    // QStash Schedules API 사용
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