import { Client } from '@upstash/qstash'

// QStash client singleton
export const qstash = process.env.QSTASH_TOKEN ? new Client({
  token: process.env.QSTASH_TOKEN!,
}) : null

// QStash 사용 가능 여부 확인
export const isQStashConfigured = () => {
  return !!(process.env.QSTASH_TOKEN && process.env.NEXT_PUBLIC_URL)
}

// 로컬 개발 여부 확인
export const isLocalDevelopment = () => {
  return process.env.NEXT_PUBLIC_URL?.includes('localhost')
}

// 환경 확인 로그 (더 자세히)
if (typeof window === 'undefined') { // 서버 사이드에서만 실행
  console.log('🔧 QStash Configuration Check:')
  console.log('- QStash Token:', process.env.QSTASH_TOKEN ? '✅ Set' : '❌ Missing')
  console.log('- QStash Token Length:', process.env.QSTASH_TOKEN ? process.env.QSTASH_TOKEN.length : 0)
  console.log('- QStash Token Preview:', process.env.QSTASH_TOKEN ? process.env.QSTASH_TOKEN.substring(0, 10) + '...' : 'N/A')
  console.log('- Next Public URL:', process.env.NEXT_PUBLIC_URL ? '✅ Set' : '❌ Missing')
  console.log('- QStash Signing Key:', process.env.QSTASH_CURRENT_SIGNING_KEY ? '✅ Set' : '❌ Missing')
  console.log('- QStash configured:', isQStashConfigured())
  
  if (isQStashConfigured()) {
    console.log('- Target URL:', `${process.env.NEXT_PUBLIC_URL}/api/content/generate-scheduled`)
  } else {
    console.log('⚠️ QStash is not fully configured - schedules will be created but not executed automatically')
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

  const url = `${process.env.NEXT_PUBLIC_URL?.trim()}/api/content/generate-scheduled`
  
  console.log('Scheduling content generation:', {
    scheduleId,
    executeAt: executeAt.toISOString(),
    url
  })
  
  try {
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
  } catch (error: any) {
    console.error('❌ QStash publishJSON failed:', {
      error: error.message,
      status: error.status,
      response: error.response,
      tokenPreview: process.env.QSTASH_TOKEN?.substring(0, 10) + '...'
    })
    throw error
  }
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

// 다음 실행 시간 계산 (한국 시간대 지원)
export function calculateNextRun(
  frequency: 'daily' | 'weekly' | 'monthly' | 'hourly' | '3hours' | '6hours',
  timeOfDay: string, // HH:mm format in KST
  timezone: string = 'Asia/Seoul',
  fromDate: Date = new Date()
): Date {
  console.log('🕐 Calculating next run:', {
    frequency,
    timeOfDay,
    timezone,
    fromDate: fromDate.toISOString(),
  })
  
  // 시간 간격 기반 스케줄링 (hourly, 3hours, 6hours)
  if (frequency === 'hourly' || frequency === '3hours' || frequency === '6hours') {
    const hoursToAdd = frequency === 'hourly' ? 1 : frequency === '3hours' ? 3 : 6
    const next = new Date(fromDate.getTime() + (hoursToAdd * 60 * 60 * 1000))
    console.log('⏰ Interval-based next run:', next.toISOString())
    return next
  }
  
  // 입력된 timeOfDay를 KST로 해석
  // 현재 시간을 KST로 변환
  const nowInKorea = new Date(fromDate.getTime() + (9 * 60 * 60 * 1000) + 1000)
  
  // 한국 시간 기준으로 목표 시간 설정
  const [hours, minutes] = timeOfDay.split(':').map(Number)
  const targetInKorea = new Date(nowInKorea)
  targetInKorea.setHours(hours, minutes, 0, 0)
  
  // 이미 지난 시간이면 다음 주기로 (2분 여유 시간 추가)
  if (targetInKorea.getTime() < (nowInKorea.getTime() - 2 * 60 * 1000)) {
    switch (frequency) {
      case 'daily':
        targetInKorea.setDate(targetInKorea.getDate() + 1)
        break
      case 'weekly':
        targetInKorea.setDate(targetInKorea.getDate() + 7)
        break
      case 'monthly':
        targetInKorea.setMonth(targetInKorea.getMonth() + 1)
        break
    }
  }
  
  // KST에서 UTC로 변환 (9시간 빼기)
  const nextRunUTC = new Date(targetInKorea.getTime() - (9 * 60 * 60 * 1000) - 1000)
  
  console.log('🎯 Final next run calculation:', {
    nowInKorea: nowInKorea.toISOString(),
    targetInKorea: targetInKorea.toISOString(), 
    nextRunUTC: nextRunUTC.toISOString(),
    inputTimeAsKST: `${timeOfDay} KST`
  })
  
  return nextRunUTC
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