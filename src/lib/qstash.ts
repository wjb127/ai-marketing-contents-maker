import { Client } from '@upstash/qstash'

// QStash client singleton
export const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
})

// 스케줄링 헬퍼 함수들
export async function scheduleContentGeneration(
  scheduleId: string, 
  executeAt: Date
) {
  const url = `${process.env.NEXT_PUBLIC_URL}/api/content/generate-scheduled`
  
  const response = await qstash.publishJSON({
    url,
    body: {
      scheduleId,
      timestamp: new Date().toISOString()
    },
    notBefore: Math.floor(executeAt.getTime() / 1000), // Unix timestamp
    retries: 3,
    timeout: '30s'
  })

  return response.messageId
}

// 스케줄 취소
export async function cancelScheduledGeneration(messageId: string) {
  try {
    await qstash.messages.delete(messageId)
    return true
  } catch (error) {
    console.error('Failed to cancel scheduled message:', error)
    return false
  }
}

// 다음 실행 시간 계산
export function calculateNextRun(
  frequency: 'daily' | 'weekly' | 'monthly',
  timeOfDay: string, // HH:mm format
  timezone: string = 'Asia/Seoul',
  fromDate: Date = new Date()
): Date {
  const [hours, minutes] = timeOfDay.split(':').map(Number)
  const next = new Date(fromDate)
  
  // 시간 설정
  next.setHours(hours, minutes, 0, 0)
  
  // 이미 지난 시간이면 다음 주기로
  if (next <= fromDate) {
    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1)
        break
      case 'weekly':
        next.setDate(next.getDate() + 7)
        break
      case 'monthly':
        next.setMonth(next.getMonth() + 1)
        break
    }
  }
  
  return next
}

// 배치 스케줄링 (여러 스케줄을 한번에)
export async function batchScheduleContent(
  schedules: Array<{
    id: string
    executeAt: Date
  }>
) {
  const messages = schedules.map(schedule => ({
    url: `${process.env.NEXT_PUBLIC_URL}/api/content/generate-scheduled`,
    body: JSON.stringify({
      scheduleId: schedule.id,
      timestamp: new Date().toISOString()
    }),
    notBefore: Math.floor(schedule.executeAt.getTime() / 1000),
    retries: 3,
    timeout: '30s'
  }))

  const response = await qstash.messages.batchCreate(messages)
  return response
}