import { NextRequest, NextResponse } from 'next/server'
import { verifySignature } from '@upstash/qstash/nextjs'
import { createClient } from '@/lib/supabase-server'
import { anthropic } from '@/lib/claude'
import { scheduleContentGeneration, calculateNextRun } from '@/lib/qstash'
import { getScheduledPromptTemplate } from '@/utils/prompt-templates'
import { evaluateAndSaveContent } from '@/lib/evaluation'
import { CREATIVITY_LEVELS } from '@/utils/constants'

async function handler(request: NextRequest) {
  let body: any
  let scheduleId: string
  
  try {
    console.log('🚀 Generate-scheduled API called')
    
    // Request body 안전하게 파싱
    try {
      body = await request.json()
      console.log('📥 Request body:', body)
    } catch (bodyError: any) {
      console.error('❌ Failed to parse request body:', bodyError)
      return NextResponse.json(
        { error: 'Invalid request body', details: bodyError?.message || 'Unknown parsing error' },
        { status: 400 }
      )
    }
    
    scheduleId = body.scheduleId

    if (!scheduleId) {
      console.error('❌ No scheduleId provided')
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Processing schedule:', scheduleId)
    const supabase = await createClient()

    // 스케줄 정보 조회 - 완전 격리
    console.log('🔎 Querying schedule from database...')
    let schedule: any = null
    try {
      const scheduleResult = await supabase
        .from('schedules')
        .select('*')
        .eq('id', scheduleId)
        .single()
      
      if (scheduleResult.error) {
        throw new Error(`Schedule query failed: ${scheduleResult.error.message}`)
      }
      
      schedule = scheduleResult.data
      if (!schedule) {
        throw new Error('Schedule not found in database')
      }
      
      console.log('✅ Schedule found:', schedule.name)
    } catch (scheduleError: any) {
      console.error('❌ Schedule lookup error:', {
        message: scheduleError?.message || 'Unknown schedule error',
        scheduleId,
        error: scheduleError
      })
      return NextResponse.json(
        { error: 'Failed to find schedule', details: scheduleError?.message || 'Schedule lookup failed' },
        { status: 404 }
      )
    }

    // 스케줄이 비활성화된 경우 중단
    if (!schedule.is_active) {
      console.log('Schedule is inactive:', scheduleId)
      return NextResponse.json({ message: 'Schedule is inactive' })
    }

    // 사용자 정보 조회 - 완전 격리
    let user: any = null
    try {
      const userResult = await supabase
        .from('users')
        .select('*')
        .eq('id', schedule.user_id)
        .single()
      
      if (userResult.error) {
        throw new Error(`User query failed: ${userResult.error.message}`)
      }
      
      user = userResult.data
      if (!user) {
        throw new Error('User not found in database')
      }
    } catch (userError: any) {
      console.error('User lookup error:', {
        message: userError?.message || 'Unknown user error',
        userId: schedule.user_id,
        error: userError
      })
      return NextResponse.json(
        { error: 'Failed to find user', details: userError?.message || 'User lookup failed' },
        { status: 404 }
      )
    }

    // 구독 상태 확인
    if (user.subscription_status !== 'active' || user.subscription_plan === 'free') {
      console.log('User subscription inactive:', schedule.user_id)
      
      // 스케줄 비활성화
      const { error: deactivateError } = await supabase
        .from('schedules')
        .update({ is_active: false })
        .eq('id', scheduleId)
      
      if (deactivateError) {
        console.error('Failed to deactivate schedule:', deactivateError)
      }
      
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
        schedule.content_tone || 'casual',
        schedule.topics?.[0] || schedule.topic || '일반 주제',
        schedule.target_audience || '',
        schedule.additional_instructions || ''
      )
    }

    // 창의성 설정 가져오기
    const creativitySettings = schedule.creativity_level 
      ? CREATIVITY_LEVELS[schedule.creativity_level as keyof typeof CREATIVITY_LEVELS]
      : CREATIVITY_LEVELS.balanced

    let generatedContent = ''
    try {
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

      generatedContent = message.content[0]?.type === 'text' 
        ? message.content[0].text 
        : '콘텐츠 생성 중 오류가 발생했습니다.'
    } catch (anthropicError: any) {
      console.error('Anthropic API error:', {
        message: anthropicError?.message || 'Unknown Anthropic error',
        error: anthropicError
      })
      generatedContent = '콘텐츠 생성 중 오류가 발생했습니다. 다시 시도해주세요.'
    }

    // 콘텐츠 저장 (dogfooding 환경에 맞게 수정)
    const { data: savedContent, error: contentError } = await supabase
      .from('contents')
      .insert({
        user_id: schedule.user_id,
        title: `${schedule.name || 'Untitled'} - 자동 생성 콘텐츠`,
        content_type: schedule.content_type,
        tone: schedule.content_tone || 'casual',
        topic: schedule.topics?.[0] || schedule.topic || '일반 주제',
        content: generatedContent,
        status: 'draft',
        schedule_id: scheduleId
        // auto_generated 필드 제거 (dogfooding 스키마에 없음)
      })
      .select()
      .single()

    if (contentError || !savedContent) {
      console.error('Failed to save content:', contentError)
      throw new Error(`Failed to save content: ${contentError?.message || JSON.stringify(contentError)}`)
    }

    // 자동 평가 수행 (백그라운드에서 실행)
    try {
      await evaluateAndSaveContent(savedContent.id)
      console.log('Scheduled content evaluation completed for:', savedContent.id)
    } catch (evaluationError: any) {
      console.error('Failed to evaluate scheduled content automatically:', {
        message: evaluationError?.message || 'Unknown evaluation error',
        contentId: savedContent.id,
        error: evaluationError
      })
      // 평가 실패해도 콘텐츠 생성은 성공으로 처리
    }

    // 사용량 업데이트
    try {
      const { error: usageUpdateError } = await supabase
        .from('users')
        .update({ 
          monthly_content_count: (user.monthly_content_count || 0) + 1 
        })
        .eq('id', schedule.user_id)
      
      if (usageUpdateError) {
        console.error('Failed to update usage count:', usageUpdateError)
      }
    } catch (usageError: any) {
      console.error('Usage update caught error:', usageError)
    }

    // 마지막 실행 시간 업데이트
    try {
      const { error: lastRunUpdateError } = await supabase
        .from('schedules')
        .update({ 
          last_run_at: new Date().toISOString() 
        })
        .eq('id', scheduleId)
      
      if (lastRunUpdateError) {
        console.error('Failed to update last run time:', lastRunUpdateError)
      }
    } catch (lastRunError: any) {
      console.error('Last run update caught error:', lastRunError)
    }

    // 다음 실행 예약
    const nextRun = calculateNextRun(
      schedule.frequency || 'daily',
      schedule.time_of_day || '09:00:00',
      schedule.timezone || 'Asia/Seoul'
    )

    let messageId: string | null = null
    try {
      messageId = await scheduleContentGeneration(scheduleId, nextRun)
    } catch (qstashError: any) {
      console.error('Failed to schedule next execution:', {
        message: qstashError?.message || 'Unknown QStash error',
        error: qstashError
      })
      // QStash 실패해도 콘텐츠 생성은 성공으로 처리
    }

    // 다음 실행 시간 저장
    try {
      const { error: nextRunUpdateError } = await supabase
        .from('schedules')
        .update({ 
          next_run_at: nextRun.toISOString(),
          qstash_message_id: messageId || null
        })
        .eq('id', scheduleId)
      
      if (nextRunUpdateError) {
        console.error('Failed to update next run time:', nextRunUpdateError)
      }
    } catch (nextRunError: any) {
      console.error('Next run update caught error:', nextRunError)
    }

    // 테스트 대시보드에 실행 기록 추가
    try {
      console.log('🕐 Logging execution to time-logger...')
      const loggerUrl = `${process.env.NEXT_PUBLIC_URL?.trim()}/api/test/time-logger`
      console.log('📍 Logger URL:', loggerUrl)
      
      const logResponse = await fetch(loggerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: scheduleId,
          timestamp: new Date().toISOString()
        })
      })
      
      const logResult = await logResponse.json()
      console.log('✅ Time-logger response:', logResult)
    } catch (logError: any) {
      console.error('Failed to log execution to time-logger:', {
        message: logError?.message || 'Unknown log error',
        error: logError
      })
      // 로그 실패해도 메인 기능은 계속 진행
    }

    return NextResponse.json({
      success: true,
      message: 'Content generated successfully',
      nextRun: nextRun.toISOString()
    })

  } catch (error: any) {
    console.error('❌ Scheduled generation error:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      errorType: typeof error,
      errorName: error?.name,
      fullError: JSON.stringify(error, null, 2)
    })
    
    // 실패 로그를 데이터베이스에 기록 (옵션)
    try {
      if (scheduleId) {
        const supabase = await createClient()
        const updateResult = await supabase
          .from('schedules')
          .update({ 
            last_run_at: new Date().toISOString()
          })
          .eq('id', scheduleId)
        
        if (updateResult.error) {
          console.error('DB update error after failure:', updateResult.error)
        }
      }
    } catch (dbError: any) {
      console.error('Failed to update schedule after error:', {
        message: dbError?.message || 'Unknown DB error',
        error: dbError
      })
    }
    
    const errorMessage = error?.message || error?.toString() || 'Unknown error occurred'
    
    return NextResponse.json(
      { error: 'Failed to generate scheduled content', details: errorMessage },
      { status: 500 }
    )
  }
}

// QStash 서명 검증은 환경변수가 있을 때만 적용
const POST = process.env.QSTASH_CURRENT_SIGNING_KEY 
  ? verifySignature(handler) 
  : handler

export { POST }

