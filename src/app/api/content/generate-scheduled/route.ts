import { NextRequest, NextResponse } from 'next/server'
import { verifySignature } from '@upstash/qstash/nextjs'
import { createClient } from '@/lib/supabase-server'
import { anthropic } from '@/lib/claude'
import { scheduleContentGeneration, calculateNextRun } from '@/lib/qstash'

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

    const supabase = createClient()

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
    const prompt = getPromptTemplate(
      schedule.content_type,
      schedule.content_tone,
      schedule.topic,
      'medium',
      schedule.target_audience,
      true,
      schedule.additional_instructions
    )

    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2000,
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

    // 콘텐츠 저장
    const { error: contentError } = await supabase
      .from('contents')
      .insert({
        user_id: schedule.user_id,
        type: schedule.content_type,
        tone: schedule.content_tone,
        topic: schedule.topic,
        content: generatedContent,
        target_audience: schedule.target_audience,
        additional_instructions: schedule.additional_instructions,
        status: 'draft',
        schedule_id: scheduleId
      })

    if (contentError) {
      console.error('Failed to save content:', contentError)
      throw contentError
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

    return NextResponse.json({
      success: true,
      message: 'Content generated successfully',
      nextRun: nextRun.toISOString()
    })

  } catch (error) {
    console.error('Scheduled generation error:', error)
    
    // 실패 로그를 데이터베이스에 기록 (옵션)
    try {
      const supabase = createClient()
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

// 프롬프트 템플릿 함수
function getPromptTemplate(
  contentType: string,
  tone: string,
  topic: string,
  length: string = 'medium',
  targetAudience?: string,
  includeHashtags?: boolean,
  additionalNotes?: string
) {
  let basePrompt = ''
  
  switch (contentType) {
    case 'x_post':
      basePrompt = `Create a single X (Twitter) post about "${topic}" in a ${tone} tone.
      
      - Keep it under 280 characters
      - Make it engaging and shareable
      - Use emojis naturally
      ${includeHashtags ? '- Include 2-3 relevant hashtags' : ''}`
      break
      
    case 'thread':
      basePrompt = `Create a Twitter thread about "${topic}" in a ${tone} tone.
      
      - Format as numbered tweets (1/X, 2/X, etc.)
      - Start with a hook in the first tweet
      - 5-7 tweets total
      - Each tweet under 280 characters
      - End with a call-to-action`
      break
      
    default:
      basePrompt = `Generate ${contentType} content about "${topic}" in ${tone} tone.`
  }
  
  if (targetAudience) {
    basePrompt += `\n- Target audience: ${targetAudience}`
  }
  
  if (additionalNotes) {
    basePrompt += `\n- Additional instructions: ${additionalNotes}`
  }
  
  basePrompt += `\n\nGenerate engaging, original content. Return only the content without meta-commentary.`
  
  return basePrompt
}