import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cancelScheduledGeneration } from '@/lib/qstash'

export async function DELETE(request: NextRequest) {
  try {
    console.log('Schedule delete API called')
    const supabase = await createClient()
    
    // DOGFOODING MODE: Skip auth check
    const user = { id: '00000000-0000-0000-0000-000000000001' }

    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('id')

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      )
    }

    console.log('Deleting schedule:', scheduleId)

    // 기존 스케줄 정보 조회 (QStash 메시지 ID 확인용)
    const { data: existingSchedule, error: fetchError } = await supabase
      .from('schedules')
      .select('qstash_message_id')
      .eq('id', scheduleId)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      console.error('Schedule not found:', fetchError)
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    // QStash 메시지 취소
    const isLocal = process.env.NEXT_PUBLIC_URL?.includes('localhost')
    
    if (process.env.QSTASH_TOKEN && !isLocal && existingSchedule?.qstash_message_id) {
      try {
        console.log('🗑️ Cancelling QStash message:', existingSchedule.qstash_message_id)
        const cancelled = await cancelScheduledGeneration(existingSchedule.qstash_message_id)
        if (cancelled) {
          console.log('✅ QStash message cancelled')
        } else {
          console.log('⚠️ Failed to cancel QStash message (may not exist)')
        }
      } catch (qstashError: any) {
        console.error('❌ Failed to cancel QStash message:', qstashError.message)
        // QStash 취소 실패해도 데이터베이스 삭제는 계속 진행
      }
    } else if (isLocal) {
      console.log('🏠 Local development - skipping QStash cancellation')
    }

    // 데이터베이스에서 스케줄 삭제
    const { error: deleteError } = await supabase
      .from('schedules')
      .delete()
      .eq('id', scheduleId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Database delete error:', deleteError)
      return NextResponse.json(
        { error: `Database error: ${deleteError.message}`, details: deleteError },
        { status: 500 }
      )
    }

    console.log('✅ Schedule deleted successfully:', scheduleId)

    return NextResponse.json({
      success: true,
      message: 'Schedule deleted successfully'
    })

  } catch (error: any) {
    console.error('Error deleting schedule:', error)
    return NextResponse.json(
      { error: 'Failed to delete schedule', details: error.message },
      { status: 500 }
    )
  }
}