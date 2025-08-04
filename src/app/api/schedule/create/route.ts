import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const scheduleData = await request.json()

    // Validate required fields
    if (!scheduleData.name || !scheduleData.contentType || !scheduleData.frequency) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate next run time
    const nextRunAt = calculateNextRun(scheduleData.frequency, scheduleData.time, scheduleData.timezone)

    const newSchedule = {
      user_id: user.id,
      name: scheduleData.name,
      content_type: scheduleData.contentType,
      frequency: scheduleData.frequency,
      time: scheduleData.time,
      timezone: scheduleData.timezone || 'UTC',
      topics: scheduleData.topics,
      tone: scheduleData.tone,
      is_active: true,
      next_run_at: nextRunAt,
      total_generated: 0,
      settings: {
        auto_publish: scheduleData.autoPublish || false,
        max_per_day: scheduleData.maxPerDay || 1,
        target_audience: scheduleData.targetAudience,
        include_hashtags: scheduleData.includeHashtags || false,
        content_length: scheduleData.contentLength || 'medium',
      },
    }

    // Here you would insert into your database
    // For now, we'll return the schedule with a mock ID
    const schedule = {
      id: Date.now().toString(),
      ...newSchedule,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Error creating schedule:', error)
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    )
  }
}

function calculateNextRun(frequency: string, time: string, timezone: string): string {
  const now = new Date()
  const [hours, minutes] = time.split(':').map(Number)
  
  let nextRun = new Date(now)
  nextRun.setHours(hours, minutes, 0, 0)
  
  // If the time has already passed today, move to the next occurrence
  if (nextRun <= now) {
    switch (frequency) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1)
        break
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7)
        break
      case 'bi_weekly':
        nextRun.setDate(nextRun.getDate() + 14)
        break
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1)
        break
    }
  }
  
  return nextRun.toISOString()
}