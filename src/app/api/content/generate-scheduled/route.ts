import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { anthropic } from '@/lib/claude'
import { scheduleContentGeneration, calculateNextRun } from '@/lib/qstash'
import { CREATIVITY_LEVELS, getCharacterLimitPromptText } from '@/utils/constants'

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
      
      // Use same approach as content generation API - bundle parameters
      const topic = schedule.topics?.[Math.floor(Math.random() * (schedule.topics?.length || 1))] || schedule.topic || ''
      
      const requestData = {
        content_type: schedule.content_type,
        type: schedule.content_type,
        tone: schedule.content_tone || 'professional',
        topic: topic,
        target_audience: schedule.target_audience,
        additional_instructions: schedule.additional_instructions
      }
      
      const bundledPrompt = Object.entries(requestData)
        .filter(([key, value]) => value !== null && value !== undefined && value !== '')
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n')

      // Smart prompt enhancement if additional_instructions is empty or missing
      let enhancedPrompt = bundledPrompt
      const hasAdditionalInstructions = schedule.additional_instructions && schedule.additional_instructions.trim()
      
      if (!hasAdditionalInstructions) {
        // AI will automatically add smart defaults based on content type and topic
        enhancedPrompt += '\n\nadditional_instructions: Use your expertise to create engaging, well-structured content that resonates with the target audience. Apply best practices for the chosen content type and tone.'
      }
      
      const creativitySettings = schedule.creativity_level 
        ? CREATIVITY_LEVELS[schedule.creativity_level as keyof typeof CREATIVITY_LEVELS]
        : CREATIVITY_LEVELS.balanced
      
      console.log('🤖 Generating content with unified approach...')
      
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        temperature: creativitySettings.temperature || 0.7,
        top_p: creativitySettings.top_p || 1.0,
        messages: [{ role: 'user', content: `Create high-quality Korean content based on these parameters:\n\n${enhancedPrompt}\n\nIMPORTANT: 
- Write in Korean (한국어)
- KEEP IT CONCISE: ${getCharacterLimitPromptText(schedule.content_type || 'x_post')}
- Write naturally like a human, avoid AI-like formatting
- NO markdown syntax (no #, ##, **, -, •, etc.)
- Use plain text with natural paragraph breaks
- Write in a conversational, engaging tone
- Make it sound genuine and personal, not robotic
- Follow Korean social media best practices
- Include relevant context and examples when appropriate
- Ensure the content matches the specified tone and content type perfectly
- Focus on key message, be concise and impactful` }]
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
          content: generatedContent,
          type: schedule.content_type,
          target_audience: schedule.target_audience || null,
          additional_instructions: schedule.additional_instructions || null,
          prompt: `content_type: ${schedule.content_type}\ntone: ${schedule.content_tone || 'casual'}\ntopic: ${schedule.topics?.[0] || schedule.topic || '일반 주제'}`,
          status: 'draft'
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
      
      // 다음 실행을 위한 반복 스케줄은 이미 설정되어 있으므로 
      // 별도의 스케줄링 불필요 (QStash가 자동으로 반복 실행)
      const messageId = schedule.qstash_message_id // 기존 스케줄 ID 유지
      
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