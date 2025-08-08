import { NextRequest, NextResponse } from 'next/server'
import { verifySignature } from '@upstash/qstash/nextjs'
import { createClient } from '@/lib/supabase-server'
import { anthropic } from '@/lib/claude'
import { scheduleContentGeneration, calculateNextRun } from '@/lib/qstash'
import { getScheduledPromptTemplate } from '@/utils/prompt-templates'
import { evaluateAndSaveContent } from '@/lib/evaluation'
import { CREATIVITY_LEVELS } from '@/utils/constants'

async function handler(request: NextRequest) {
  try {
    const body = await request.json()
    const { scheduleId } = body

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 스케줄 정보 조회
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', scheduleId)
      .single()

    if (scheduleError || !schedule) {
      console.error('Schedule not found:', scheduleError)
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    // 스케줄이 비활성화된 경우 중단
    if (!schedule.is_active) {
      console.log('Schedule is inactive:', scheduleId)
      return NextResponse.json({ message: 'Schedule is inactive' })
    }

    // 사용자 정보 및 구독 상태 확인
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', schedule.user_id)
      .single()

    if (userError || !user) {
      console.error('User not found:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 구독 상태 확인
    if (user.subscription_status !== 'active' || user.subscription_plan === 'free') {
      console.log('User subscription inactive:', schedule.user_id)
      
      // 스케줄 비활성화
      await supabase
        .from('schedules')
        .update({ is_active: false })
        .eq('id', scheduleId)
      
      return NextResponse.json({ 
        message: 'User subscription inactive, schedule disabled' 
      })
    }

    // 사용량 확인
    const monthlyLimit = {
      pro: 50,
      premium: -1 // unlimited
    }[user.subscription_plan] || 5

    if (monthlyLimit !== -1 && user.monthly_content_count >= monthlyLimit) {
      console.log('Monthly limit reached for user:', schedule.user_id)
      return NextResponse.json({ 
        message: 'Monthly content limit reached' 
      })
    }

    // AI로 콘텐츠 생성
    let prompt
    
    // 설정에서 프롬프트 타입 확인
    const promptSettings = schedule.settings || {}
    
    if (promptSettings.promptType === 'custom' && promptSettings.customPrompt) {
      // 커스텀 프롬프트 사용
      prompt = promptSettings.customPrompt
    } else {
      // 자동 프롬프트 사용
      prompt = getScheduledPromptTemplate(
        schedule.content_type,
        schedule.content_tone,
        schedule.topics?.[0] || '',
        schedule.target_audience,
        schedule.additional_instructions
      )
    }

    // 창의성 설정 가져오기
    const creativitySettings = schedule.creativity_level 
      ? CREATIVITY_LEVELS[schedule.creativity_level as keyof typeof CREATIVITY_LEVELS]
      : CREATIVITY_LEVELS.balanced

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: creativitySettings.temperature,
      top_p: creativitySettings.top_p,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const generatedContent = message.content[0]?.type === 'text' 
      ? message.content[0].text 
      : ''

    // 콘텐츠 저장 (dogfooding 환경에 맞게 수정)
    const { data: savedContent, error: contentError } = await supabase
      .from('contents')
      .insert({
        user_id: schedule.user_id,
        title: `${schedule.name} - 자동 생성 콘텐츠`,
        content_type: schedule.content_type,
        tone: schedule.content_tone,
        topic: schedule.topics?.[0] || '',
        content: generatedContent,
        status: 'draft',
        schedule_id: scheduleId
        // auto_generated 필드 제거 (dogfooding 스키마에 없음)
      })
      .select()
      .single()

    if (contentError || !savedContent) {
      console.error('Failed to save content:', contentError)
      throw contentError
    }

    // 자동 평가 수행 (백그라운드에서 실행)
    try {
      await evaluateAndSaveContent(savedContent.id)
      console.log('Scheduled content evaluation completed for:', savedContent.id)
    } catch (evaluationError) {
      console.error('Failed to evaluate scheduled content automatically:', evaluationError)
      // 평가 실패해도 콘텐츠 생성은 성공으로 처리
    }

    // 사용량 업데이트
    await supabase
      .from('users')
      .update({ 
        monthly_content_count: user.monthly_content_count + 1 
      })
      .eq('id', schedule.user_id)

    // 마지막 실행 시간 업데이트
    await supabase
      .from('schedules')
      .update({ 
        last_run_at: new Date().toISOString() 
      })
      .eq('id', scheduleId)

    // 다음 실행 예약
    const nextRun = calculateNextRun(
      schedule.frequency,
      schedule.time_of_day,
      schedule.timezone
    )

    const messageId = await scheduleContentGeneration(scheduleId, nextRun)

    // 다음 실행 시간 저장
    await supabase
      .from('schedules')
      .update({ 
        next_run_at: nextRun.toISOString(),
        qstash_message_id: messageId
      })
      .eq('id', scheduleId)

    // 테스트 대시보드에 실행 기록 추가
    try {
      await fetch(`${process.env.NEXT_PUBLIC_URL?.trim()}/api/test/time-logger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: scheduleId,
          timestamp: new Date().toISOString()
        })
      })
    } catch (logError) {
      console.error('Failed to log execution to time-logger:', logError)
      // 로그 실패해도 메인 기능은 계속 진행
    }

    return NextResponse.json({
      success: true,
      message: 'Content generated successfully',
      nextRun: nextRun.toISOString()
    })

  } catch (error) {
    console.error('Scheduled generation error:', error)
    
    // 실패 로그를 데이터베이스에 기록 (옵션)
    try {
      const supabase = await createClient()
      await supabase
        .from('schedules')
        .update({ 
          last_run_at: new Date().toISOString()
        })
        .eq('id', body?.scheduleId)
    } catch (dbError) {
      console.error('Failed to update schedule after error:', dbError)
    }
    
    return NextResponse.json(
      { error: 'Failed to generate scheduled content', details: error.message },
      { status: 500 }
    )
  }
}

// QStash 서명 검증은 환경변수가 있을 때만 적용
const POST = process.env.QSTASH_CURRENT_SIGNING_KEY 
  ? verifySignature(handler) 
  : handler

export { POST }

