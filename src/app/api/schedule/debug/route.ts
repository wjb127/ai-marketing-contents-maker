import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { calculateNextRun, isQStashConfigured } from '@/lib/qstash'

// 스케줄 디버깅용 엔드포인트
export async function GET() {
  try {
    const supabase = await createClient()
    
    // 현재 시간 정보 (UTC+9 + 1초 보정)
    const koreaOffsetMs = (9 * 60 * 60 * 1000) + 1000 // UTC+9 + 1 second
    const now = new Date()
    const nowKST = new Date(now.getTime() + koreaOffsetMs)
    
    // 모든 스케줄 조회
    const { data: schedules, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('is_active', true)
    
    if (error) {
      throw error
    }

    const scheduleDebugInfo = schedules?.map(schedule => {
      let nextRun = null
      let nextRunKST = null
      
      try {
        nextRun = calculateNextRun(
          schedule.frequency,
          schedule.time_of_day,
          schedule.timezone || 'Asia/Seoul'
        )
        nextRunKST = new Date(nextRun.getTime() + koreaOffsetMs)
      } catch (error) {
        console.error(`Error calculating next run for schedule ${schedule.id}:`, error)
      }
      
      return {
        id: schedule.id,
        name: schedule.name,
        frequency: schedule.frequency,
        time_of_day: schedule.time_of_day,
        timezone: schedule.timezone,
        is_active: schedule.is_active,
        last_run_at: schedule.last_run_at,
        next_run_at: schedule.next_run_at,
        calculated_next_run_utc: nextRun?.toISOString(),
        calculated_next_run_kst: nextRunKST?.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
        qstash_message_id: schedule.qstash_message_id,
        created_at: schedule.created_at
      }
    })

    return NextResponse.json({
      current_time: {
        utc: now.toISOString(),
        kst: nowKST.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
      },
      qstash_configured: isQStashConfigured(),
      environment: {
        qstash_token: !!process.env.QSTASH_TOKEN,
        next_public_url: process.env.NEXT_PUBLIC_URL || null,
        qstash_signing_key: !!process.env.QSTASH_CURRENT_SIGNING_KEY
      },
      schedules_count: schedules?.length || 0,
      schedules: scheduleDebugInfo
    })
  } catch (error: any) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}