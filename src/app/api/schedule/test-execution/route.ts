import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { scheduleContentGeneration } from '@/lib/qstash'

// QStash 서명 검증 없이 스케줄 실행 테스트하는 API
export async function POST(request: NextRequest) {
  try {
    const { scheduleId } = await request.json()
    
    if (!scheduleId) {
      return NextResponse.json(
        { error: 'scheduleId is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // 스케줄 조회
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', scheduleId)
      .single()

    if (scheduleError || !schedule) {
      return NextResponse.json(
        { error: 'Schedule not found', details: scheduleError },
        { status: 404 }
      )
    }

    console.log('🔍 Found schedule:', {
      id: schedule.id,
      name: schedule.name,
      qstash_message_id: schedule.qstash_message_id,
      next_run_at: schedule.next_run_at
    })

    // QStash 메시지 생성 테스트 (1분 후)
    const executeAt = new Date(Date.now() + 60 * 1000)
    let messageId = null
    
    try {
      messageId = await scheduleContentGeneration(schedule.id, executeAt)
      console.log('✅ QStash message created:', messageId)
    } catch (qstashError) {
      console.error('❌ QStash message creation failed:', qstashError)
    }

    // QStash 메시지 ID 업데이트 테스트
    if (messageId) {
      const { error: updateError } = await supabase
        .from('schedules')
        .update({ qstash_message_id: messageId })
        .eq('id', scheduleId)
      
      if (updateError) {
        console.error('❌ Failed to update qstash_message_id:', updateError)
        return NextResponse.json({
          success: false,
          error: 'Failed to update qstash_message_id',
          details: updateError,
          messageId,
          schedule
        })
      } else {
        console.log('✅ Successfully updated qstash_message_id')
      }
    }

    return NextResponse.json({
      success: true,
      schedule,
      messageId,
      executeAt: executeAt.toISOString(),
      message: 'Test execution completed'
    })

  } catch (error: any) {
    console.error('❌ Test execution error:', error)
    return NextResponse.json(
      { error: 'Test execution failed', details: error.message },
      { status: 500 }
    )
  }
}