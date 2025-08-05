import { anthropic } from '@/lib/claude'
import { createClient } from '@/lib/supabase-server'
import { ContentEvaluationCriteria } from '@/types'

const EVALUATION_PROMPT = `
콘텐츠를 다음 기준으로 평가해주세요:

1. **관련성 (Relevance)** (1-5점): 콘텐츠가 주제와 얼마나 관련이 있는가?
2. **품질 (Quality)** (1-5점): 콘텐츠의 전반적인 품질은 어떤가?
3. **참여도 (Engagement)** (1-5점): 독자들이 얼마나 관심을 가질 것 같은가?
4. **창의성 (Creativity)** (1-5점): 콘텐츠가 얼마나 독창적이고 창의적인가?
5. **명확성 (Clarity)** (1-5점): 메시지가 얼마나 명확하고 이해하기 쉬운가?
6. **톤 정확성 (Tone Accuracy)** (1-5점): 요청된 톤이 얼마나 잘 반영되었는가?

다음 JSON 형식으로만 응답해주세요:
{
  "overall_rating": 4.2,
  "criteria": {
    "relevance": 4,
    "quality": 4,
    "engagement": 5,
    "creativity": 4,
    "clarity": 4,
    "tone_accuracy": 4
  },
  "feedback": "구체적인 피드백과 개선 사항을 한국어로 작성"
}

평가할 콘텐츠:
---
제목: {title}
타입: {content_type}
주제: {topic}
톤: {tone}
대상 독자: {target_audience}

콘텐츠:
{content}
---
`

export interface EvaluationResult {
  rating: number
  feedback: string
  criteria: ContentEvaluationCriteria
  evaluation_model: string
}

export async function evaluateContent(
  content: {
    id: string
    title?: string
    content: string
    content_type: string
    topic?: string
    tone: string
    metadata?: {
      target_audience?: string
    }
  }
): Promise<EvaluationResult> {
  try {
    // Claude Sonnet 4로 평가 요청
    const evaluationPrompt = EVALUATION_PROMPT
      .replace('{title}', content.title || '제목 없음')
      .replace('{content_type}', content.content_type)
      .replace('{topic}', content.topic || '주제 없음')
      .replace('{tone}', content.tone)
      .replace('{target_audience}', content.metadata?.target_audience || '일반 독자')
      .replace('{content}', content.content)

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: evaluationPrompt
        }
      ]
    })

    const evaluationText = message.content[0]?.type === 'text' ? message.content[0].text : ''
    
    // JSON 파싱
    let evaluationResult
    try {
      // JSON 부분만 추출 (마크다운 블록이나 다른 텍스트가 있을 수 있음)
      const jsonMatch = evaluationText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      evaluationResult = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('Failed to parse evaluation response:', evaluationText)
      throw new Error('Failed to parse AI evaluation response')
    }

    const criteria: ContentEvaluationCriteria = evaluationResult.criteria || {}
    const rating = evaluationResult.overall_rating || 0
    const feedback = evaluationResult.feedback || ''

    return {
      rating,
      feedback,
      criteria,
      evaluation_model: 'claude-sonnet-4-20250514'
    }

  } catch (error) {
    console.error('Error evaluating content:', error)
    throw new Error('Failed to evaluate content')
  }
}

export async function saveEvaluationToDatabase(
  contentId: string, 
  evaluation: EvaluationResult
): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('contents')
    .update({
      ai_rating: evaluation.rating,
      ai_feedback: evaluation.feedback,
      ai_evaluation_criteria: evaluation.criteria,
      evaluated_at: new Date().toISOString(),
      evaluation_model: evaluation.evaluation_model
    })
    .eq('id', contentId)

  if (error) {
    console.error('Failed to save evaluation:', error)
    throw new Error('Failed to save evaluation results')
  }
}

export async function evaluateAndSaveContent(contentId: string): Promise<EvaluationResult> {
  const supabase = await createClient()
  
  // 콘텐츠 조회
  const { data: content, error: contentError } = await supabase
    .from('contents')
    .select('*')
    .eq('id', contentId)
    .single()

  if (contentError || !content) {
    throw new Error('Content not found')
  }

  // 이미 평가된 경우 기존 평가 반환
  if (content.ai_rating && content.evaluated_at) {
    return {
      rating: content.ai_rating,
      feedback: content.ai_feedback,
      criteria: content.ai_evaluation_criteria,
      evaluation_model: content.evaluation_model
    }
  }

  // 평가 수행
  const evaluation = await evaluateContent(content)
  
  // 데이터베이스에 저장
  await saveEvaluationToDatabase(contentId, evaluation)
  
  return evaluation
}