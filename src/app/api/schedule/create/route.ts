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
    console.log('Calculated next run time:', nextRun.toISOString())

    // Prepare data for insertion
    const insertData = {
      user_id: user.id,
      name,
      content_type,
      tone,
      topics: [topic], // Convert single topic to array
      target_audience,
      additional_instructions,
      frequency: dbFrequency, // Use mapped frequency for database
      time: time_of_day,
      timezone,
      is_active: true,
      next_run_at: nextRun.toISOString(),
      settings: {
        ...settings,
        actualFrequency: frequency // Store actual frequency in settings
      }
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

    // Schedule with QStash (only if QStash is configured)
    let qstashScheduled = false
    if (process.env.QSTASH_TOKEN) {
      try {
        const messageId = await scheduleContentGeneration(data.id, nextRun)
        
        // Update schedule with QStash message ID
        await supabase
          .from('schedules')
          .update({ qstash_message_id: messageId })
          .eq('id', data.id)
          
        qstashScheduled = true
        console.log('Schedule created and queued with QStash:', messageId)
      } catch (qstashError) {
        console.error('Failed to schedule with QStash:', qstashError)
        // 스케줄은 생성되었지만 QStash 예약 실패
        // 나중에 크론잡으로 복구 가능
      }
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