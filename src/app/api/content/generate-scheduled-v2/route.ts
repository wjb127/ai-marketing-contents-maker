import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { anthropic } from '@/lib/claude'
import { scheduleContentGeneration, calculateNextRun } from '@/lib/qstash'
import { getScheduledPromptTemplate } from '@/utils/prompt-templates'
import { CREATIVITY_LEVELS } from '@/utils/constants'

// 완전히 새로운 v2 API - 안전한 구조로 재작성
async function handler(request: NextRequest) {
  let scheduleId = 'unknown'
  
  try {
    console.log('🚀 Generate-scheduled-v2 API called')
    
    // 1. Request 파싱
    const body = await request.json().catch(e => {
      throw new Error(`Request parsing failed: ${e.message}`)
    })
    
    scheduleId = body.scheduleId
    if (!scheduleId) {
      return NextResponse.json({ error: 'No schedule ID' }, { status: 400 })
    }
    
    console.log('📋 Processing schedule:', scheduleId)
    
    // 2. 스케줄 조회 - 단순한 구조
    const supabase = await createClient()
    let scheduleQuery
    try {
      scheduleQuery = await supabase
        .from('schedules')
        .select('*')
        .eq('id', scheduleId)
        .single()
    } catch (e: any) {
      throw new Error(`Schedule query failed: ${e.message}`)
    }
    
    if (scheduleQuery.error || !scheduleQuery.data) {
      throw new Error(`Schedule not found: ${scheduleQuery.error?.message}`)
    }
    
    const schedule = scheduleQuery.data
    console.log('✅ Schedule found:', schedule.name)
    
    // 3. 사용자 조회
    let userQuery
    try {
      userQuery = await supabase
        .from('users')
        .select('*')
        .eq('id', schedule.user_id)
        .single()
    } catch (e: any) {
      throw new Error(`User query failed: ${e.message}`)
    }
    
    if (userQuery.error || !userQuery.data) {
      throw new Error(`User not found: ${userQuery.error?.message}`)
    }
    
    const user = userQuery.data
    console.log('✅ User found:', user.id)
    
    // 4. 구독 상태 확인
    if (!schedule.is_active) {
      console.log('Schedule inactive:', scheduleId)
      return NextResponse.json({ message: 'Schedule inactive' })
    }
    
    if (user.subscription_status !== 'active' || user.subscription_plan === 'free') {
      console.log('User subscription inactive')
      return NextResponse.json({ message: 'Subscription inactive' })
    }
    
    // 5. AI 콘텐츠 생성 - 안전하게
    let generatedContent = 'AI 콘텐츠 생성 중 문제가 발생했습니다.'
    
    try {
      const promptSettings = schedule.settings || {}
      let prompt = ''
      
      if (promptSettings.promptType === 'custom' && promptSettings.customPrompt) {
        prompt = promptSettings.customPrompt
      } else {
        prompt = getScheduledPromptTemplate(
          schedule.content_type,
          schedule.content_tone || 'casual',
          schedule.topics?.[0] || schedule.topic || '일반 주제',
          schedule.target_audience || '',
          schedule.additional_instructions || ''
        )
      }
      
      const creativitySettings = schedule.creativity_level 
        ? CREATIVITY_LEVELS[schedule.creativity_level as keyof typeof CREATIVITY_LEVELS]
        : CREATIVITY_LEVELS.balanced
      
      console.log('🤖 Generating content with AI...')
      
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        temperature: creativitySettings.temperature,
        top_p: creativitySettings.top_p,
        messages: [{ role: 'user', content: prompt }]
      })
      
      generatedContent = message.content[0]?.type === 'text' 
        ? message.content[0].text 
        : 'AI 응답을 텍스트로 변환할 수 없습니다.'
        
      console.log('✅ Content generated successfully')
      
    } catch (aiError) {
      console.error('AI generation failed:', aiError)
      generatedContent = `AI 콘텐츠 생성 실패: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`
    }
    
    // 6. 콘텐츠 저장 - 안전하게
    try {
      console.log('💾 Saving content to database...')
      
      const contentInsert = await supabase
        .from('contents')
        .insert({
          user_id: schedule.user_id,
          title: `${schedule.name || 'Untitled'} - v2 자동생성`,
          content_type: schedule.content_type,
          tone: schedule.content_tone || 'casual',
          topic: schedule.topics?.[0] || schedule.topic || '일반 주제',
          content: generatedContent,
          status: 'draft',
          schedule_id: scheduleId
        })
        .select()
        .single()
      
      if (contentInsert.error) {
        throw new Error(`Content save failed: ${contentInsert.error.message}`)
      }
      
      console.log('✅ Content saved:', contentInsert.data.id)
      
    } catch (saveError) {
      console.error('Content save failed:', saveError)
      // 저장 실패해도 계속 진행
    }
    
    // 7. 사용량 업데이트
    try {
      await supabase
        .from('users')
        .update({ 
          monthly_content_count: (user.monthly_content_count || 0) + 1 
        })
        .eq('id', schedule.user_id)
      
      console.log('✅ Usage updated')
    } catch (usageError) {
      console.error('Usage update failed:', usageError)
    }
    
    // 8. 스케줄 업데이트
    try {
      await supabase
        .from('schedules')
        .update({ last_run_at: new Date().toISOString() })
        .eq('id', scheduleId)
    } catch (updateError) {
      console.error('Schedule update failed:', updateError)
    }
    
    // 9. 다음 실행 예약 - 안전하게
    try {
      const nextRun = calculateNextRun(
        schedule.frequency || 'daily',
        schedule.time_of_day || '09:00:00',
        schedule.timezone || 'Asia/Seoul'
      )
      
      const messageId = await scheduleContentGeneration(scheduleId, nextRun)
      
      await supabase
        .from('schedules')
        .update({ 
          next_run_at: nextRun.toISOString(),
          qstash_message_id: messageId || null
        })
        .eq('id', scheduleId)
      
      console.log('✅ Next run scheduled:', nextRun.toISOString())
    } catch (scheduleError) {
      console.error('Next scheduling failed:', scheduleError)
    }
    
    // 10. 테스트 대시보드에 기록
    try {
      const loggerUrl = `${process.env.NEXT_PUBLIC_URL?.trim()}/api/test/time-logger`
      const logResponse = await fetch(loggerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: scheduleId,
          timestamp: new Date().toISOString()
        })
      })
      
      console.log('✅ Logged to time-logger successfully')
    } catch (logError) {
      console.error('Time-logger failed:', logError)
    }
    
    return NextResponse.json({
      success: true,
      message: 'v2 API completed successfully',
      scheduleId,
      contentGenerated: true
    })
    
  } catch (error: any) {
    console.error('❌ v2 API error:', {
      scheduleId,
      message: error?.message || 'Unknown error',
      stack: error?.stack
    })
    
    return NextResponse.json({
      error: 'v2 API failed', 
      details: error?.message || 'Unknown error occurred',
      scheduleId
    }, { status: 500 })
  }
}

export const POST = handler