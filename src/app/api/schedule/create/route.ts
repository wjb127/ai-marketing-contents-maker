import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { scheduleContentGeneration, calculateNextRun } from '@/lib/qstash'

export async function POST(request: NextRequest) {
  try {
    console.log('Schedule create API called')
    const supabase = await createClient()
    
    // DOGFOODING MODE: Skip auth check
    const user = { id: '00000000-0000-0000-0000-000000000001' }

    const scheduleData = await request.json()
    console.log('Received schedule data:', scheduleData)

    // Validate required fields
    const {
      name,
      content_type,
      content_tone: tone,
      topic,
      target_audience,
      additional_instructions,
      frequency,
      time_of_day,
      timezone = 'Asia/Seoul',
      settings = {}
    } = scheduleData

    console.log('Extracted fields:', {
      name,
      content_type,
      tone,
      topic,
      frequency,
      time_of_day
    })

    if (!name || !content_type || !tone || !topic || !frequency || !time_of_day) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Map new frequency values to existing enum values for database storage
    let dbFrequency = frequency
    if (frequency === 'hourly' || frequency === '3hours' || frequency === '6hours') {
      dbFrequency = 'daily' // Store as daily but handle differently in QStash scheduling
    }

    // Calculate next run time
    const nextRun = calculateNextRun(frequency, time_of_day, timezone)
    
    // KST로 변환해서 로그 출력 (+1시간 30분 보정)
    const nextRunKST = new Date(nextRun.getTime() + 1.5 * 60 * 60 * 1000)
    console.log('📅 Next run scheduled:', {
      utc: nextRun.toISOString(),
      kst: nextRunKST.toISOString(),
      kstReadable: nextRunKST.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
    })

    // Prepare data for insertion (dogfooding schema)
    const insertData = {
      user_id: user.id,
      name,
      content_type,
      content_tone: tone, // dogfooding schema uses content_tone
      topic: topic || '', // dogfooding schema uses single topic
      target_audience,
      additional_instructions,
      frequency: frequency, // Store original frequency
      time_of_day,
      timezone,
      is_active: true,
      next_run_at: nextRun.toISOString()
      // settings removed - not in dogfooding schema
    }
    console.log('Data to insert:', insertData)

    // Create schedule in database
    const { data, error } = await supabase
      .from('schedules')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Database insertion error:', error)
      return NextResponse.json(
        { error: `Database error: ${error.message}`, details: error },
        { status: 500 }
      )
    }

    console.log('Schedule created in database:', data)

    // Schedule with QStash (only if QStash is configured and not local development)
    let qstashScheduled = false
    const isLocal = process.env.NEXT_PUBLIC_URL?.includes('localhost')
    
    if (process.env.QSTASH_TOKEN && !isLocal) {
      try {
        console.log('🔄 Starting QStash scheduling for schedule:', data.id)
        console.log('🔄 NextRun time:', {
          utc: nextRun.toISOString(),
          timestamp: nextRun.getTime(),
          unixSeconds: Math.floor(nextRun.getTime() / 1000)
        })
        
        const messageId = await scheduleContentGeneration(data.id, nextRun)
        
        console.log('✅ QStash message created successfully:', messageId)
        
        // Update schedule with QStash message ID
        const { error: updateError } = await supabase
          .from('schedules')
          .update({ qstash_message_id: messageId })
          .eq('id', data.id)
          
        if (updateError) {
          console.error('❌ Failed to update schedule with QStash message ID:', updateError)
          throw new Error(`Failed to update QStash message ID: ${updateError.message}`)
        }
          
        qstashScheduled = true
        console.log('✅ Schedule created and queued with QStash:', messageId)
      } catch (qstashError: any) {
        console.error('❌ Failed to schedule with QStash:', {
          error: qstashError.message,
          stack: qstashError.stack,
          scheduleId: data.id,
          nextRun: nextRun.toISOString()
        })
        // 스케줄은 생성되었지만 QStash 예약 실패
        // 나중에 크론잡으로 복구 가능
      }
    } else if (isLocal) {
      console.log('🏠 Local development detected - using database-only scheduling')
      qstashScheduled = true // 로컬에서는 DB 기반 스케줄링 사용
    } else {
      console.log('⚠️ QStash token not found, skipping scheduling')
    }

    return NextResponse.json({
      ...data,
      next_run_at: nextRun.toISOString(),
      qstash_scheduled: qstashScheduled
    })

  } catch (error) {
    console.error('Error creating schedule:', error)
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    )
  }
}