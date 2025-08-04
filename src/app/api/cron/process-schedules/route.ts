import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { anthropic } from '@/lib/claude'

// Vercel Cron Job 버전 - 간단한 구현
// vercel.json에 설정 필요:
// {
//   "crons": [{
//     "path": "/api/cron/process-schedules",
//     "schedule": "*/5 * * * *"
//   }]
// }

export async function GET(request: NextRequest) {
  try {
    // Vercel Cron Job 인증 확인
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    const now = new Date()

    // 실행해야 할 스케줄 조회
    const { data: schedules, error } = await supabase
      .from('schedules')
      .select(`
        *,
        users!inner(
          subscription_plan,
          subscription_status,
          monthly_content_count
        )
      `)
      .eq('is_active', true)
      .or(`next_run_at.is.null,next_run_at.lte.${now.toISOString()}`)
      .limit(50) // 한 번에 처리할 최대 스케줄 수

    if (error) {
      console.error('Failed to fetch schedules:', error)
      return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 })
    }

    const results = []

    for (const schedule of schedules || []) {
      try {
        // 구독 확인
        if (schedule.users.subscription_status !== 'active') {
          await supabase
            .from('schedules')
            .update({ is_active: false })
            .eq('id', schedule.id)
          continue
        }

        // 사용량 확인
        const limits = {
          free: 5,
          pro: 50,
          premium: -1
        }
        const limit = limits[schedule.users.subscription_plan] || 5
        
        if (limit !== -1 && schedule.users.monthly_content_count >= limit) {
          console.log(`User ${schedule.user_id} reached monthly limit`)
          continue
        }

        // 실행 시간 확인
        if (schedule.next_run_at && new Date(schedule.next_run_at) > now) {
          continue
        }

        // AI 콘텐츠 생성
        const prompt = `Generate ${schedule.content_type} content about "${schedule.topic}" in ${schedule.content_tone} tone.`
        
        const message = await anthropic.messages.create({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }]
        })

        const content = message.content[0]?.type === 'text' ? message.content[0].text : ''

        // 콘텐츠 저장
        await supabase
          .from('contents')
          .insert({
            user_id: schedule.user_id,
            type: schedule.content_type,
            tone: schedule.content_tone,
            topic: schedule.topic,
            content,
            target_audience: schedule.target_audience,
            additional_instructions: schedule.additional_instructions,
            status: 'draft',
            schedule_id: schedule.id
          })

        // 사용량 증가
        await supabase
          .from('users')
          .update({ 
            monthly_content_count: schedule.users.monthly_content_count + 1 
          })
          .eq('id', schedule.user_id)

        // 다음 실행 시간 계산 및 업데이트
        const nextRun = calculateNextRun(
          schedule.frequency,
          schedule.time_of_day
        )

        await supabase
          .from('schedules')
          .update({ 
            last_run_at: now.toISOString(),
            next_run_at: nextRun.toISOString()
          })
          .eq('id', schedule.id)

        results.push({
          scheduleId: schedule.id,
          userId: schedule.user_id,
          status: 'success'
        })

      } catch (error) {
        console.error(`Failed to process schedule ${schedule.id}:`, error)
        results.push({
          scheduleId: schedule.id,
          userId: schedule.user_id,
          status: 'failed',
          error: error.message
        })
      }
    }

    return NextResponse.json({
      processed: results.length,
      results
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateNextRun(
  frequency: string,
  timeOfDay: string
): Date {
  const [hours, minutes] = timeOfDay.split(':').map(Number)
  const next = new Date()
  
  next.setHours(hours, minutes, 0, 0)
  
  // 이미 지난 시간이면 다음 주기로
  if (next <= new Date()) {
    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1)
        break
      case 'weekly':
        next.setDate(next.getDate() + 7)
        break
      case 'monthly':
        next.setMonth(next.getMonth() + 1)
        break
    }
  }
  
  return next
}