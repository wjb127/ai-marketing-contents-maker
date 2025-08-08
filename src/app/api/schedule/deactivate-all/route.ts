import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cancelScheduledGeneration } from '@/lib/qstash'

// 모든 스케줄 비활성화 (테스트용)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    console.log('🛑 Deactivating all TEST schedules...')
    
    // 테스트 스케줄만 조회 (이름에 "테스트" 또는 "Test" 포함)
    const { data: schedules, error: fetchError } = await supabase
      .from('schedules')
      .select('id, qstash_message_id, name')
      .eq('is_active', true)
      .or('name.ilike.%테스트%,name.ilike.%test%,name.ilike.%Test%')
    
    if (fetchError) {
      throw new Error(`Failed to fetch schedules: ${fetchError.message}`)
    }
    
    if (!schedules || schedules.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active schedules found',
        deactivated: 0
      })
    }
    
    console.log(`Found ${schedules.length} active schedules`)
    
    // QStash 메시지 취소
    let cancelledMessages = 0
    for (const schedule of schedules) {
      if (schedule.qstash_message_id) {
        try {
          await cancelScheduledGeneration(schedule.qstash_message_id)
          cancelledMessages++
          console.log(`✅ Cancelled QStash message for: ${schedule.name}`)
        } catch (error) {
          console.error(`❌ Failed to cancel message for ${schedule.name}:`, error)
        }
      }
    }
    
    // 테스트 스케줄만 비활성화
    const { error: updateError } = await supabase
      .from('schedules')
      .update({ 
        is_active: false,
        qstash_message_id: null,
        next_run_at: null
      })
      .eq('is_active', true)
      .or('name.ilike.%테스트%,name.ilike.%test%,name.ilike.%Test%')
    
    if (updateError) {
      throw new Error(`Failed to deactivate schedules: ${updateError.message}`)
    }
    
    console.log(`🛑 Deactivated ${schedules.length} schedules and cancelled ${cancelledMessages} QStash messages`)
    
    return NextResponse.json({
      success: true,
      message: `Successfully deactivated ${schedules.length} schedules`,
      deactivated: schedules.length,
      qstashCancelled: cancelledMessages,
      scheduleNames: schedules.map(s => s.name)
    })
    
  } catch (error: any) {
    console.error('Error deactivating schedules:', error)
    return NextResponse.json(
      { 
        error: 'Failed to deactivate schedules',
        details: error.message 
      },
      { status: 500 }
    )
  }
}