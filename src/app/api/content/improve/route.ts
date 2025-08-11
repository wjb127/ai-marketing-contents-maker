import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { anthropic } from '@/lib/claude'
import { ContentType, ContentTone } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // DOGFOODING MODE: Skip auth check
    const user = { id: '00000000-0000-0000-0000-000000000001' }

    const {
      content_id,
      original_content,
      evaluation_feedback,
      evaluation_criteria,
      content_type,
      tone,
      topic
    } = await request.json()

    if (!original_content || !evaluation_feedback) {
      return NextResponse.json(
        { error: 'Original content and evaluation feedback are required' },
        { status: 400 }
      )
    }

    console.log('🤖 Improving content based on AI feedback')
    
    // 개선 프롬프트 생성
    const improvementPrompt = `기존 콘텐츠를 AI 평가 피드백을 바탕으로 개선해주세요.

기존 콘텐츠:
"""
${original_content}
"""

콘텐츠 정보:
- 타입: ${content_type}
- 톤: ${tone}
- 주제: ${topic}

AI 평가 피드백:
"""
${evaluation_feedback}
"""

세부 평가 점수:
${evaluation_criteria ? Object.entries(evaluation_criteria)
  .map(([key, value]) => `- ${key}: ${value}/5`)
  .join('\n') : ''}

개선 요구사항:
1. 위 피드백의 지적사항을 모두 반영하여 콘텐츠를 개선하세요
2. 낮은 점수를 받은 평가 기준을 중점적으로 개선하세요
3. 기존 콘텐츠의 핵심 메시지와 톤은 유지하면서 품질을 향상시키세요
4. 한국어로 작성하고, 자연스럽고 매력적인 콘텐츠로 만드세요
5. 최대 500자 이내로 작성하세요
6. 마크다운 문법 사용 금지, 일반 텍스트로만 작성
7. 소셜미디어 플랫폼에 적합한 형태로 작성

개선된 콘텐츠만 출력하세요 (설명이나 부가 텍스트 없이):`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: improvementPrompt
        }
      ]
    })

    const improvedContent = message.content[0]?.type === 'text' ? message.content[0].text : ''
    
    console.log('✅ Content improved successfully')
    
    // 개선된 콘텐츠를 새로운 레코드로 저장
    const { data: contentData, error: contentError } = await supabase
      .from('contents')
      .insert({
        user_id: user.id,
        content: improvedContent,
        type: content_type || 'x_post',
        target_audience: null,
        additional_instructions: `[개선된 콘텐츠] 원본 ID: ${content_id || 'unknown'}\n\n적용된 피드백:\n${evaluation_feedback}`,
        prompt: `피드백 기반 개선 - 원본: ${original_content.substring(0, 100)}...`,
        status: 'draft'
      })
      .select()
      .single()

    if (contentError) {
      console.error('❌ Failed to save improved content:', contentError)
      return NextResponse.json(
        { 
          error: 'Failed to save improved content',
          details: contentError.message
        },
        { status: 500 }
      )
    }

    return NextResponse.json(contentData)
  } catch (error) {
    console.error('Error improving content:', error)
    return NextResponse.json(
      { error: 'Failed to improve content' },
      { status: 500 }
    )
  }
}