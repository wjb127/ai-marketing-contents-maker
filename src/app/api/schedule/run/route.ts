import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/claude'
import { CONTENT_TYPE_SPECS } from '@/utils/constants'

// This would be called by a cron job or scheduler
export async function POST(request: NextRequest) {
  try {
    // In a real implementation, you would:
    // 1. Get all active schedules that are due to run
    // 2. For each schedule, generate content
    // 3. Save the content as draft or publish based on settings
    // 4. Update the schedule's next_run_at and last_run_at

    const { scheduleId } = await request.json()

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      )
    }

    // Mock schedule data - in real app, fetch from database
    const schedule = {
      id: scheduleId,
      user_id: 'user-123',
      name: 'Daily Tech Tips',
      content_type: 'x_post' as const,
      frequency: 'daily' as const,
      time: '09:00',
      timezone: 'UTC',
      topics: ['AI', 'Programming', 'Tech News'],
      tone: 'educational' as const,
      is_active: true,
      settings: {
        auto_publish: false,
        max_per_day: 1,
        target_audience: 'Developers',
        include_hashtags: true,
        content_length: 'medium',
      },
    }

    // Select a random topic
    const randomTopic = schedule.topics[Math.floor(Math.random() * schedule.topics.length)]

    // Generate content
    const content = await generateContentForSchedule(schedule, randomTopic)

    // Save content to database
    const savedContent = {
      id: Date.now().toString(),
      user_id: schedule.user_id,
      title: `Auto-generated: ${randomTopic}`,
      content: content,
      content_type: schedule.content_type,
      tone: schedule.tone,
      status: schedule.settings.auto_publish ? 'published' : 'draft',
      topic: randomTopic,
      tags: schedule.topics,
      auto_generated: true,
      schedule_id: schedule.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Update schedule stats
    const updatedSchedule = {
      ...schedule,
      total_generated: (schedule as any).total_generated + 1,
      last_run_at: new Date().toISOString(),
      next_run_at: calculateNextRun(schedule.frequency, schedule.time, schedule.timezone),
    }

    return NextResponse.json({
      success: true,
      content: savedContent,
      schedule: updatedSchedule,
    })
  } catch (error) {
    console.error('Error running scheduled content generation:', error)
    return NextResponse.json(
      { error: 'Failed to run scheduled generation' },
      { status: 500 }
    )
  }
}

async function generateContentForSchedule(schedule: any, topic: string): Promise<string> {
  const spec = CONTENT_TYPE_SPECS[schedule.content_type]
  
  let prompt = ''
  
  switch (schedule.content_type) {
    case 'x_post':
      prompt = `Create a ${schedule.tone} X (Twitter) post about "${topic}".
      
      - Keep it under 280 characters
      - Make it engaging and shareable
      - Target audience: ${schedule.settings.target_audience || 'General'}
      - Content length: ${schedule.settings.content_length}`
      break
      
    case 'thread':
      prompt = `Create a Twitter thread about "${topic}" in a ${schedule.tone} tone.
      
      - Format as numbered tweets (1/X, 2/X, etc.)
      - 5-7 tweets total
      - Each tweet under 280 characters
      - Target audience: ${schedule.settings.target_audience || 'General'}`
      break
      
    case 'blog_post':
      prompt = `Write a blog post about "${topic}" in a ${schedule.tone} tone.
      
      - Include compelling title
      - 3-5 main sections
      - ${schedule.settings.content_length} length
      - Target audience: ${schedule.settings.target_audience || 'General'}`
      break
      
    case 'linkedin_post':
      prompt = `Create a LinkedIn post about "${topic}" in a ${schedule.tone} tone.
      
      - Professional and valuable content
      - Use line breaks for readability
      - End with engagement question
      - Target audience: ${schedule.settings.target_audience || 'Professionals'}`
      break
      
    default:
      prompt = `Create content about "${topic}" in a ${schedule.tone} tone for ${schedule.content_type}.`
  }
  
  if (schedule.settings.include_hashtags && spec.recommendedHashtags > 0) {
    prompt += `\n- Include ${spec.recommendedHashtags} relevant hashtags`
  }
  
  prompt += '\n\nReturn only the content without additional explanations.'

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  })

  return message.content[0]?.type === 'text' ? message.content[0].text : ''
}

function calculateNextRun(frequency: string, time: string, timezone: string): string {
  const now = new Date()
  const [hours, minutes] = time.split(':').map(Number)
  
  let nextRun = new Date(now)
  nextRun.setHours(hours, minutes, 0, 0)
  
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
  
  return nextRun.toISOString()
}