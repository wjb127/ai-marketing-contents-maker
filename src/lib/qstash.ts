import { Client } from '@upstash/qstash'

// QStash client singleton
export const qstash = process.env.QSTASH_TOKEN ? new Client({
  token: process.env.QSTASH_TOKEN!,
}) : null

// QStash 사용 가능 여부 확인
export const isQStashConfigured = () => {
  return !!(process.env.QSTASH_TOKEN && process.env.NEXT_PUBLIC_URL)
}

// 환경 확인 로그
if (typeof window === 'undefined') { // 서버 사이드에서만 실행
  console.log('QStash configured:', isQStashConfigured())
  if (isQStashConfigured()) {
    console.log('QStash URL:', process.env.NEXT_PUBLIC_URL)
  }
}

// 스케줄링 헬퍼 함수들
export async function scheduleContentGeneration(
  scheduleId: string, 
  executeAt: Date
) {
  if (!qstash || !isQStashConfigured()) {
    throw new Error('QStash is not configured. Please set QSTASH_TOKEN and NEXT_PUBLIC_URL')
  }

  const url = `${process.env.NEXT_PUBLIC_URL}/api/content/generate-scheduled`
  
  console.log('Scheduling content generation:', {
    scheduleId,
    executeAt: executeAt.toISOString(),
    url
  })
  
  const response = await qstash.publishJSON({
    url,
    body: {
      scheduleId,
      timestamp: new Date().toISOString()
    },
    notBefore: Math.floor(executeAt.getTime() / 1000), // Unix timestamp
    retries: 3,
    timeout: '60s', // 타임아웃 증가
    headers: {
      'Content-Type': 'application/json'
    }
  })

  console.log('QStash message scheduled:', response.messageId)
  return response.messageId
}

// 스케줄 취소
export async function cancelScheduledGeneration(messageId: string) {
  if (!qstash || !messageId) {
    return false
  }

  try {
    await qstash.messages.delete(messageId)
    console.log('QStash message cancelled:', messageId)
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