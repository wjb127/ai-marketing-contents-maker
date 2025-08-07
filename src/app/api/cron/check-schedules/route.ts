import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// 로컬 개발용 크론잡 - 스케줄 체크 및 실행
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking schedules for execution...')
    
    const supabase = await createClient()
    const now = new Date()
    
    // 현재 시간에 실행해야 할 스케줄들 찾기
    const { data: schedules, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('is_active', true)
      .lte('next_run_at', now.toISOString())
    
    if (error) {
      console.error('Error fetching schedules:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`📋 Found ${schedules?.length || 0} schedules to execute`)

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({ 
        message: 'No schedules to execute',
        checked_at: now.toISOString()
      })
    }

    const results = []
    
    for (const schedule of schedules) {
      try {
        console.log(`⚡ Executing schedule: ${schedule.name}`)
        
        // 스케줄 실행
        const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/schedule/run`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            scheduleId: schedule.id
          })
        })

        if (response.ok) {
          const result = await response.json()
          results.push({
            schedule_id: schedule.id,
            schedule_name: schedule.name,
            status: 'success',
            content_id: result.content?.id
          })
          console.log(`✅ Successfully executed: ${schedule.name}`)
        } else {
          const error = await response.text()
          results.push({
            schedule_id: schedule.id,
            schedule_name: schedule.name,
            status: 'failed',
            error: error
          })
          console.log(`❌ Failed to execute: ${schedule.name}`)
        }
      } catch (error: any) {
        results.push({
          schedule_id: schedule.id,
          schedule_name: schedule.name,
          status: 'error',
          error: error.message
        })
        console.error(`💥 Error executing ${schedule.name}:`, error)
      }
    }

    return NextResponse.json({
      message: 'Schedule check completed',
      executed_count: results.length,
      results: results,
      checked_at: now.toISOString()
    })

  } catch (error: any) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Failed to check schedules' },
      { status: 500 }
    )
  }
}