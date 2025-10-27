import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { anthropic } from '@/lib/claude'
import { ContentType, ContentTone } from '@/types'
import { CONTENT_TYPE_SPECS, CREATIVITY_LEVELS, getCharacterLimitPromptText } from '@/utils/constants'
import { getDatabasePromptTemplate, logPromptUsage } from '@/utils/db-prompt-templates'
import { evaluateAndSaveContent } from '@/lib/evaluation'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // DOGFOODING MODE: Skip auth check
    const user = { id: '00000000-0000-0000-0000-000000000001' }

    const requestData = await request.json()
    
    // Bundle all parameters into a single prompt string  
    const prompt = Object.entries(requestData)
      .filter(([key, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')

    // DOGFOODING MODE: Skip subscription checks
    const monthlyCount = 0

    console.log('🤖 Generating content with simple prompt')
    
    // Smart prompt enhancement if additional_instructions is empty or missing
    let enhancedPrompt = prompt
    const hasAdditionalInstructions = requestData.additional_instructions && requestData.additional_instructions.trim()
    
    if (!hasAdditionalInstructions) {
      // AI will automatically add smart defaults based on content type and topic
      enhancedPrompt += '\n\nadditional_instructions: Use your expertise to create engaging, well-structured content that resonates with the target audience. Apply best practices for the chosen content type and tone.'
    }
    
    // Handle informal tone (반말)
    const toneInstructions = requestData.tone === 'informal' 
      ? '- Use informal Korean language (반말체) throughout the content\n- Write in a friendly, casual tone as if talking to a close friend\n- Use casual endings like -야, -어, -지, etc.'
      : '- Write in a conversational, engaging tone\n- Make it sound genuine and personal, not robotic'
    
    // Apply STICK principle for X Post
    const stickInstructions = requestData.type === 'x_post' 
      ? `\n\nApply the STICK principle for viral X posts:
- S (Simple): 간단하고 명확한 메시지 - 한 번에 하나의 핵심 아이디어만
- T (Triggering): 감정을 자극하는 내용 - 공감, 놀라움, 호기심 유발
- I (Interesting): 흥미로운 스토리나 사실 - 독자가 계속 읽고 싶게 만들기
- C (Credible): 신뢰할 수 있는 내용 - 구체적인 숫자나 사례 포함
- K (Kind/Shareable): 공유하고 싶은 가치 있는 콘텐츠 - 유용하거나 재미있는 정보`
      : ''
    
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: `Create high-quality Korean content based on these parameters:\n\n${enhancedPrompt}${stickInstructions}\n\nIMPORTANT: 
- Write in Korean (한국어)
- KEEP IT CONCISE: ${getCharacterLimitPromptText(requestData.type || 'x_post')}
- Write naturally like a human, avoid AI-like formatting
- NO markdown syntax (no #, ##, **, -, •, etc.)
- Use plain text with natural paragraph breaks
${toneInstructions}
- Follow Korean social media best practices
- Include relevant context and examples when appropriate
- Ensure the content matches the specified tone and content type perfectly
- Focus on key message, be concise and impactful`
        }
      ]
    })

    const generatedContent = message.content[0]?.type === 'text' ? message.content[0].text : ''
    
    console.log('✅ Content generated successfully')
    
    // Save content to database (actual schema)
    const { data: contentData, error: contentError } = await supabase
      .from('contents')
      .insert({
        user_id: user.id,
        content: generatedContent,
        type: requestData.type || 'x_post',
        target_audience: requestData.target_audience || null,
        additional_instructions: requestData.additional_instructions || null,
        prompt: prompt,
        status: 'draft'
      })
      .select()
      .single()

    if (contentError) {
      console.error('❌ Failed to save content - Error details:', JSON.stringify(contentError, null, 2))
      console.error('❌ Insert data that failed:', JSON.stringify({
        user_id: user.id,
        content: generatedContent.substring(0, 100) + '...',
        type: requestData.type || 'x_post',
        tone: requestData.tone || 'professional',
        topic: requestData.topic || '일반 주제',
        status: 'draft'
      }, null, 2))
      return NextResponse.json(
        { 
          error: 'Failed to save generated content',
          details: contentError.message,
          code: contentError.code
        },
        { status: 500 }
      )
    }

    // DOGFOODING MODE: Skip updating user's monthly content count

    return NextResponse.json(contentData)
  } catch (error) {
    console.error('Error generating content:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}