import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { anthropic } from '@/lib/claude'
import { CREATIVITY_LEVELS, getCharacterLimitPromptText } from '@/utils/constants'

// 스케줄 즉시 실행 (테스트용)
export async function POST(request: NextRequest) {
  try {
    const { scheduleId } = await request.json()

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

    // 사용자 정보 조회
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

    // AI로 콘텐츠 생성 (콘텐츠 생성 API와 동일한 방식)
    const topic = schedule.topics?.[Math.floor(Math.random() * (schedule.topics?.length || 1))] || schedule.topic || ''
    
    // Bundle all parameters into a single prompt string (same as content generation API)
    const requestData = {
      content_type: schedule.content_type,
      type: schedule.content_type,
      tone: schedule.tone || schedule.content_tone || 'professional',
      topic: topic,
      target_audience: schedule.target_audience,
      additional_instructions: schedule.additional_instructions
    }
    
    const prompt = Object.entries(requestData)
      .filter(([key, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')

    // Smart prompt enhancement if additional_instructions is empty or missing
    let enhancedPrompt = prompt
    const hasAdditionalInstructions = schedule.additional_instructions && schedule.additional_instructions.trim()
    
    if (!hasAdditionalInstructions) {
      // AI will automatically add smart defaults based on content type and topic
      enhancedPrompt += '\n\nadditional_instructions: Use your expertise to create engaging, well-structured content that resonates with the target audience. Apply best practices for the chosen content type and tone.'
    }

    // 창의성 설정 가져오기
    const creativitySettings = schedule.creativity_level 
      ? CREATIVITY_LEVELS[schedule.creativity_level as keyof typeof CREATIVITY_LEVELS]
      : CREATIVITY_LEVELS.balanced

    console.log('🤖 Generating scheduled content with unified prompt approach')
    
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: creativitySettings.temperature || 0.7,
      top_p: creativitySettings.top_p || 1.0,
      messages: [
        {
          role: 'user',
          content: `Create high-quality Korean content based on these parameters:\n\n${enhancedPrompt}\n\nIMPORTANT: 
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
- Focus on key message, be concise and impactful`
        }
      ]
    })

    const generatedContent = message.content[0]?.type === 'text' 
      ? message.content[0].text 
      : ''
      
    console.log('✅ Scheduled content generated successfully')

    // 콘텐츠 저장 (actual schema)
    const contentData: any = {
      user_id: schedule.user_id,
      content: generatedContent,
      type: schedule.content_type,
      target_audience: schedule.target_audience || null,
      additional_instructions: schedule.additional_instructions || null,
      prompt: `content_type: ${schedule.content_type}\ntone: ${schedule.tone || schedule.content_tone || 'professional'}\ntopic: ${schedule.topics?.[0] || schedule.topic || ''}`,
      status: 'draft'
    }
    
    console.log('📝 Attempting to save content:', JSON.stringify(contentData, null, 2))
    
    const { data: savedContent, error: contentError } = await supabase
      .from('contents')
      .insert(contentData)
      .select()
      .single()

    if (contentError) {
      console.error('❌ Failed to save content - Error details:', JSON.stringify(contentError, null, 2))
      console.error('❌ Content data that failed:', JSON.stringify(contentData, null, 2))
      console.error('❌ Schedule data:', JSON.stringify({
        id: schedule.id,
        user_id: schedule.user_id,
        content_type: schedule.content_type,
        tone: schedule.tone,
        content_tone: schedule.content_tone
      }, null, 2))
      throw new Error(`콘텐츠 저장 실패: ${contentError.message} (code: ${contentError.code})`)
    }

    if (!savedContent) {
      console.error('❌ No content returned from insert operation')
      throw new Error('No content returned from database')
    }

    console.log('✅ Content saved successfully:', JSON.stringify(savedContent, null, 2))

    // 스케줄 통계 업데이트
    await supabase
      .from('schedules')
      .update({ 
        total_generated: (schedule.total_generated || 0) + 1,
        last_run_at: new Date().toISOString()
      })
      .eq('id', scheduleId)

    return NextResponse.json({
      success: true,
      message: '콘텐츠가 성공적으로 생성되었습니다.',
      content: savedContent,
      schedule: {
        id: schedule.id,
        name: schedule.name,
        total_generated: (schedule.total_generated || 0) + 1
      }
    })

  } catch (error: any) {
    console.error('Error running scheduled content generation:', error)
    const errorMessage = error.message || 'Unknown error occurred'
    const errorDetails = {
      message: errorMessage,
      stack: error.stack,
      name: error.name
    }
    console.error('Error details:', errorDetails)
    
    return NextResponse.json(
      { 
        error: 'Failed to run scheduled generation', 
        message: errorMessage,
        details: errorDetails 
      },
      { status: 500 }
    )
  }
}

