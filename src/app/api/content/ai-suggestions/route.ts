import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/claude'
import { ContentType } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { topic, contentType } = await request.json()

    if (!topic || !contentType) {
      return NextResponse.json(
        { error: 'Topic and content type are required' },
        { status: 400 }
      )
    }

    console.log('🤖 Generating AI variable suggestions for:', { topic, contentType })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: `주제 "${topic}"와 콘텐츠 타입 "${contentType}"에 최적화된 추가 요청사항 변수들을 생성해주세요.

다음 형식으로 실용적이고 구체적인 변수들을 제안해주세요:

타겟 오디언스: [구체적인 타겟 설명]
톤: [상세한 톤 설명]
길이: [권장 길이와 이유]
스타일: [시각적/문체적 스타일]
핵심 메시지: [전달하고자 하는 핵심 내용]
호출 행동(CTA): [원하는 독자 반응]
해시태그 스타일: [해시태그 사용 방향성]
참조 정보: [포함할 데이터나 통계]
금지 사항: [피해야 할 내용이나 표현]
특별 요구사항: [기타 고려사항]

각 변수는 주제와 콘텐츠 타입에 맞게 구체적이고 실행 가능한 내용으로 작성해주세요.
예시가 아닌 실제 사용할 수 있는 구체적인 내용을 제공해주세요.
한국어로 작성하고, 각 항목은 한 줄로 간결하게 작성해주세요.`
        }
      ]
    })

    const suggestions = message.content[0]?.type === 'text' ? message.content[0].text : ''

    console.log('✅ AI suggestions generated successfully')

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Error generating AI suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI suggestions' },
      { status: 500 }
    )
  }
}