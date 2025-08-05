import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { ContentEvaluationRequest, ContentEvaluationResponse } from '@/types'
import { evaluateAndSaveContent } from '@/lib/evaluation'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // DOGFOODING MODE: Skip auth check
    const user = { id: '00000000-0000-0000-0000-000000000001' }

    const { content_id }: ContentEvaluationRequest = await request.json()

    if (!content_id) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      )
    }

    // 콘텐츠 조회
    const { data: content, error: contentError } = await supabase
      .from('contents')
      .select('*')
      .eq('id', content_id)
      .eq('user_id', user.id) // 권한 확인
      .single()

    if (contentError || !content) {
      return NextResponse.json(
        { error: 'Content not found or access denied' },
        { status: 404 }
      )
    }

    // 평가 수행 및 저장
    const evaluation = await evaluateAndSaveContent(content_id)
    
    const alreadyEvaluated = content.ai_rating && content.evaluated_at
    
    return NextResponse.json({
      rating: evaluation.rating,
      feedback: evaluation.feedback,
      criteria: evaluation.criteria,
      evaluation_model: evaluation.evaluation_model,
      ...(alreadyEvaluated && { already_evaluated: true })
    } as ContentEvaluationResponse & { already_evaluated?: boolean })

  } catch (error) {
    console.error('Error evaluating content:', error)
    return NextResponse.json(
      { error: 'Failed to evaluate content' },
      { status: 500 }
    )
  }
}