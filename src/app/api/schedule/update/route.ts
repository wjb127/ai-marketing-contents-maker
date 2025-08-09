import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { scheduleContentGeneration, cancelScheduledGeneration, calculateNextRun } from '@/lib/qstash'

export async function PUT(request: NextRequest) {
  try {
    console.log('Schedule update API called')
    const supabase = await createClient()
    
    // DOGFOODING MODE: Skip auth check
    const user = { id: '00000000-0000-0000-0000-000000000001' }

    const body = await request.json()
    const { id, ...updates } = body
    console.log('Received update data:', { id, updates })

    if (!id) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      )
    }

    // 기존 스케줄 정보 조회
    const { data: existingSchedule, error: fetchError } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingSchedule) {
      console.error('Schedule not found:', fetchError)
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    console.log('Existing schedule:', existingSchedule)

    // 시간이나 빈도가 변경되었는지 확인
    const timeChanged = updates.time_of_day && updates.time_of_day !== existingSchedule.time_of_day
    const frequencyChanged = updates.frequency && updates.frequency !== existingSchedule.frequency
    const scheduleChanged = timeChanged || frequencyChanged

    let newQstashMessageId = existingSchedule.qstash_message_id
    let nextRun = existingSchedule.next_run_at

    if (scheduleChanged) {
      console.log('🔄 Schedule timing changed, updating QStash...')
      
      // 새로운 실행 시간 계산
      const newFrequency = updates.frequency || existingSchedule.frequency
      const newTimeOfDay = updates.time_of_day || existingSchedule.time_of_day
      const newTimezone = updates.timezone || existingSchedule.timezone || 'Asia/Seoul'
      
      nextRun = calculateNextRun(newFrequency, newTimeOfDay, newTimezone)
      
      // KST로 변환해서 로그 출력 (+1초 보정)
      const nextRunKST = new Date(nextRun.getTime() + 1000)
      console.log('📅 New next run scheduled:', {
        utc: nextRun.toISOString(),
        kst: nextRunKST.toISOString(),
        kstReadable: nextRunKST.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
      })

      // 로컬 개발 환경 확인
      const isLocal = process.env.NEXT_PUBLIC_URL?.includes('localhost')
      
      if (process.env.QSTASH_TOKEN && !isLocal) {
        try {
          // 기존 QStash 메시지 취소
          if (existingSchedule.qstash_message_id) {
            console.log('🗑️ Cancelling existing QStash message:', existingSchedule.qstash_message_id)
            const cancelled = await cancelScheduledGeneration(existingSchedule.qstash_message_id)
            if (cancelled) {
              console.log('✅ Previous QStash message cancelled')
            } else {
              console.log('⚠️ Failed to cancel previous QStash message (may not exist)')
            }
          }

          // 새로운 QStash 메시지 생성
          console.log('🔄 Creating new QStash schedule for:', id)
          newQstashMessageId = await scheduleContentGeneration(id, nextRun)
          console.log('✅ New QStash message created:', newQstashMessageId)
        } catch (qstashError: any) {
          console.error('❌ Failed to update QStash schedule:', qstashError.message)
          // QStash 실패해도 데이터베이스 업데이트는 계속 진행
          newQstashMessageId = null
        }
      } else if (isLocal) {
        console.log('🏠 Local development - using database-only scheduling')
        newQstashMessageId = existingSchedule.qstash_message_id // 로컬에서는 기존 값 유지
      } else {
        console.log('⚠️ QStash not configured, schedule timing update skipped')
        newQstashMessageId = null
      }
    }

    // 데이터베이스 업데이트
    const updateData = {
      ...updates,
      // nextRun이 Date 객체인지 확인하고 적절히 처리
      next_run_at: nextRun instanceof Date ? nextRun.toISOString() : nextRun
    }

    console.log('Updating schedule with:', updateData)

    // 먼저 qstash_message_id 없이 업데이트 시도
    let { data, error } = await supabase
      .from('schedules')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    // qstash_message_id 컬럼이 있으면 별도로 업데이트
    if (!error && scheduleChanged && newQstashMessageId !== existingSchedule.qstash_message_id) {
      console.log('Updating qstash_message_id separately:', newQstashMessageId)
      const { error: qstashUpdateError } = await supabase
        .from('schedules')
        .update({ qstash_message_id: newQstashMessageId })
        .eq('id', id)
        .eq('user_id', user.id)
      
      if (qstashUpdateError) {
        console.log('qstash_message_id 컬럼이 없거나 업데이트 실패:', qstashUpdateError.message)
        // qstash_message_id 업데이트 실패해도 전체 업데이트는 성공으로 처리
      } else {
        // 성공한 경우 최신 데이터 다시 조회
        const { data: updatedData } = await supabase
          .from('schedules')
          .select('*')
          .eq('id', id)
          .single()
        if (updatedData) data = updatedData
      }
    }

    if (error) {
      console.error('Database update error:', error)
      return NextResponse.json(
        { error: `Database error: ${error.message}`, details: error },
        { status: 500 }
      )
    }

    console.log('✅ Schedule updated successfully:', data)

    return NextResponse.json({
      ...data,
      schedule_updated: scheduleChanged,
      qstash_updated: scheduleChanged && !!newQstashMessageId
    })

  } catch (error: any) {
    console.error('Error updating schedule:', error)
    return NextResponse.json(
      { error: 'Failed to update schedule', details: error.message },
      { status: 500 }
    )
  }
}