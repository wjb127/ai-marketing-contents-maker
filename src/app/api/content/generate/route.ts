import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { anthropic } from '@/lib/claude'
import { ContentType, ContentTone } from '@/types'
import { CONTENT_TYPE_SPECS, CREATIVITY_LEVELS } from '@/utils/constants'
import { getDatabasePromptTemplate, logPromptUsage } from '@/utils/db-prompt-templates'
import { evaluateAndSaveContent } from '@/lib/evaluation'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // DOGFOODING MODE: Skip auth check
    const user = { id: '00000000-0000-0000-0000-000000000001' }

    const { 
      type,
      topic, 
      tone, 
      target_audience,
      additional_instructions,
      creativityLevel = 'balanced',
      temperature,
      top_p
    } = await request.json()

    if (!topic || !type || !tone) {
      return NextResponse.json(
        { error: 'Type, topic, and tone are required' },
        { status: 400 }
      )
    }

    // DOGFOODING MODE: Skip subscription checks
    const monthlyCount = 0

    // 데이터베이스에서 프롬프트 템플릿 가져오기
    const startTime = Date.now()
    const prompt = await getDatabasePromptTemplate(
      type,
      tone,
      topic,
      target_audience,
      additional_instructions
    )
    const promptFetchTime = Date.now() - startTime

    // 창의성 파라미터 설정
    const creativitySettings = temperature && top_p ? {
      temperature,
      top_p
    } : CREATIVITY_LEVELS[creativityLevel as keyof typeof CREATIVITY_LEVELS] || CREATIVITY_LEVELS.balanced

    console.log('🤖 Generating content with database prompt template')
    const generateStartTime = Date.now()
    
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

    const generateTime = Date.now() - generateStartTime
    const generatedContent = message.content[0]?.type === 'text' ? message.content[0].text : ''
    
    console.log('✅ Content generated successfully using database prompt')
    
    // Save content to database
    const { data: contentData, error: contentError } = await supabase
      .from('contents')
      .insert({
        user_id: user.id,
        title: `${topic} - ${new Date().toLocaleDateString('ko-KR')}`,
        content_type: type,
        tone,
        topic,
        content: generatedContent,
        status: 'draft'
      })
      .select()
      .single()

    if (contentError) {
      console.error('Error saving content:', contentError)
      return NextResponse.json(
        { error: 'Failed to save generated content' },
        { status: 500 }
      )
    }

    // DOGFOODING MODE: Skip updating user's monthly content count

    // 자동 평가 수행 (백그라운드에서 실행)
    try {
      await evaluateAndSaveContent(contentData.id)
      console.log('Content evaluation completed for:', contentData.id)
    } catch (evaluationError) {
      console.error('Failed to evaluate content automatically:', evaluationError)
      // 평가 실패해도 콘텐츠 생성은 성공으로 처리
    }

    return NextResponse.json(contentData)
  } catch (error) {
    console.error('Error generating content:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}