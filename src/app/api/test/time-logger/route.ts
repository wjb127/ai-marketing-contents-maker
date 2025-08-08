import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// 실행 로그를 저장할 배열 (메모리)
let executionLogs: any[] = []

// 스케줄 실행 시간 기록 API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scheduleId, timestamp } = body
    
    const now = new Date()
    
    const logEntry = {
      scheduleId,
      executedAt: now.toISOString(),
      executedAtKST: now.toISOString(), // UTC 시간 그대로 저장
      readableKST: now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }), // 표시할 때만 KST로 변환
      timestamp: timestamp || now.toISOString(),
      message: '✅ 스케줄이 실행되었습니다!'
    }
    
    // 메모리에 로그 저장 (최대 10개)
    executionLogs.unshift(logEntry)
    if (executionLogs.length > 10) {
      executionLogs = executionLogs.slice(0, 10)
    }
    
    console.log('🕐 Schedule Executed:', logEntry)
    
    // 데이터베이스에도 기록 (옵션)
    if (scheduleId) {
      try {
        const supabase = await createClient()
        await supabase
          .from('schedules')
          .update({ 
            last_run_at: now.toISOString()
          })
          .eq('id', scheduleId)
      } catch (dbError) {
        console.error('DB update failed:', dbError)
      }
    }
    
    return NextResponse.json({
      success: true,
      ...logEntry
    })
    
  } catch (error: any) {
    console.error('❌ Time logger error:', error)
    return NextResponse.json(
      { error: 'Failed to log execution', details: error.message },
      { status: 500 }
    )
  }
}

// 실행 로그 조회
export async function GET() {
  const now = new Date()
  return NextResponse.json({
    message: '시간 기록 API',
    currentTime: now.toISOString(),
    currentTimeKST: now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
    recentExecutions: executionLogs,
    totalExecutions: executionLogs.length
  })
}