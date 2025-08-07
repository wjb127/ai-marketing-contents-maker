import { createClient } from '@/lib/supabase-server'
import { ContentType, ContentTone } from '@/types'

// 데이터베이스에서 활성 프롬프트 템플릿 가져오기
export async function getActivePromptTemplate(templateName: string): Promise<string | null> {
  try {
    const supabase = await createClient()
    
    const { data: template, error } = await supabase
      .from('system_prompt_templates')
      .select('template, variables')
      .eq('name', templateName)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error(`❌ Error fetching prompt template '${templateName}':`, error)
      return null
    }

    if (!template) {
      console.warn(`⚠️ No active template found for '${templateName}'`)
      return null
    }

    console.log(`✅ Retrieved active template: ${templateName}`)
    return template.template
  } catch (error: any) {
    console.error(`❌ Error in getActivePromptTemplate for '${templateName}':`, error)
    return null
  }
}

// 프롬프트 템플릿에서 변수 치환
export function replacePromptVariables(
  template: string,
  variables: {
    topic?: string
    tone?: string
    target_audience?: string
    additional_instructions?: string
    content_type?: string
    [key: string]: any
  }
): string {
  let processedTemplate = template

  // 각 변수를 템플릿에서 치환
  Object.entries(variables).forEach(([key, value]) => {
    if (value) {
      const regex = new RegExp(`{{${key}}}`, 'g')
      processedTemplate = processedTemplate.replace(regex, value.toString())
    }
  })

  // 남은 빈 변수들은 기본값으로 치환 또는 제거
  processedTemplate = processedTemplate.replace(/{{\w+}}/g, '')

  return processedTemplate
}

// 콘텐츠 타입에 따른 템플릿명 매핑
function getTemplateNameFromContentType(contentType: ContentType): string {
  const templateMapping: Record<ContentType, string> = {
    'x_post': 'x_post_generation',
    'thread': 'thread_generation',
    'blog_post': 'blog_post_generation',
    'youtube_script': 'youtube_script_generation',
    'instagram_reel_script': 'instagram_reel_generation',
    'linkedin_post': 'linkedin_post_generation',
    'facebook_post': 'facebook_post_generation'
  }

  return templateMapping[contentType] || 'x_post_generation'
}

// 데이터베이스 기반 프롬프트 생성 (메인 함수)
export async function getDatabasePromptTemplate(
  contentType: ContentType,
  tone: ContentTone,
  topic: string,
  targetAudience?: string,
  additionalInstructions?: string
): Promise<string> {
  const templateName = getTemplateNameFromContentType(contentType)
  
  // 1. 데이터베이스에서 템플릿 가져오기 시도
  const dbTemplate = await getActivePromptTemplate(templateName)
  
  if (dbTemplate) {
    // 데이터베이스 템플릿이 있으면 변수 치환 후 반환
    const processedTemplate = replacePromptVariables(dbTemplate, {
      topic,
      tone,
      target_audience: targetAudience,
      additional_instructions: additionalInstructions,
      content_type: contentType
    })
    
    console.log(`✅ Using database template for ${templateName}`)
    return processedTemplate
  } else {
    // 2. 데이터베이스 템플릿이 없으면 폴백 프롬프트 사용
    console.log(`⚠️ Database template not found, using fallback for ${templateName}`)
    return getFallbackPromptTemplate(contentType, tone, topic, targetAudience, additionalInstructions)
  }
}

// 폴백용 기본 프롬프트 (데이터베이스가 없을 때)
function getFallbackPromptTemplate(
  contentType: ContentType,
  tone: ContentTone,
  topic: string,
  targetAudience?: string,
  additionalInstructions?: string
): string {
  const basePrompts: Record<ContentType, string> = {
    'x_post': `당신은 전문적인 소셜미디어 콘텐츠 크리에이터입니다. 다음 조건에 맞는 X(Twitter) 포스트를 작성해주세요.

주제: ${topic}
톤앤매너: ${tone}
${targetAudience ? `타겟 오디언스: ${targetAudience}` : ''}
${additionalInstructions ? `추가 지시사항: ${additionalInstructions}` : ''}

작성 가이드라인:
1. 280자 이내로 작성
2. 명확하고 직관적인 메시지
3. ${tone} 톤에 맞는 표현 사용
4. 필요시 관련 해시태그 2-3개 포함
5. 행동을 유도하는 CTA 포함 고려

창의적이고 참여도가 높은 콘텐츠를 만들어주세요.`,

    'thread': `당신은 전문적인 소셜미디어 콘텐츠 크리에이터입니다. 다음 조건에 맞는 Thread(연속 트윗)를 작성해주세요.

주제: ${topic}
톤앤매너: ${tone}
${targetAudience ? `타겟 오디언스: ${targetAudience}` : ''}
${additionalInstructions ? `추가 지시사항: ${additionalInstructions}` : ''}

작성 가이드라인:
1. 첫 번째 트윗은 hook 역할 (흥미 유발)
2. 각 트윗은 280자 이내
3. 5-8개의 연속된 트윗으로 구성
4. 논리적 순서로 정보 전달
5. 각 트윗 끝에 번호 표시 (1/8, 2/8...)
6. 마지막 트윗에는 요약이나 CTA 포함
7. ${tone} 톤에 맞는 일관된 문체

교육적이면서 참여도 높은 thread를 작성해주세요.`,

    'blog_post': `당신은 전문적인 콘텐츠 마케터이자 블로거입니다. 다음 조건에 맞는 블로그 포스트를 작성해주세요.

주제: ${topic}
톤앤매너: ${tone}
${targetAudience ? `타겟 오디언스: ${targetAudience}` : ''}
${additionalInstructions ? `추가 지시사항: ${additionalInstructions}` : ''}

작성 가이드라인:
1. 매력적인 제목과 서론으로 시작
2. 명확한 구조 (헤딩 사용)
3. ${tone} 톤에 맞는 문체
4. 실용적이고 가치 있는 정보 제공
5. 자연스러운 키워드 포함 (SEO 고려)
6. 마무리에 핵심 포인트 요약
7. 1000-1500자 분량

독자에게 실질적인 도움이 되는 고품질 콘텐츠를 작성해주세요.`,

    'linkedin_post': `당신은 전문적인 비즈니스 콘텐츠 크리에이터입니다. 다음 조건에 맞는 LinkedIn 포스트를 작성해주세요.

주제: ${topic}
톤앤매너: ${tone}
${targetAudience ? `타겟 오디언스: ${targetAudience}` : ''}
${additionalInstructions ? `추가 지시사항: ${additionalInstructions}` : ''}

작성 가이드라인:
1. 전문적이고 신뢰할 수 있는 톤
2. 비즈니스 가치나 인사이트 제공
3. 개인적 경험이나 사례 포함
4. 토론을 유도하는 질문 포함
5. 적절한 비즈니스 해시태그 활용
6. 1300자 이내 작성
7. 단락을 나누어 가독성 향상

전문성과 인간미를 모두 보여주는 콘텐츠를 작성해주세요.`,

    'youtube_script': `YouTube 영상 스크립트를 작성해주세요.

주제: ${topic}
톤앤매너: ${tone}
${targetAudience ? `타겟 시청자: ${targetAudience}` : ''}
${additionalInstructions ? `추가 지시사항: ${additionalInstructions}` : ''}

구성 가이드라인:
1. 0-15초: 강력한 훅으로 시작
2. 15-30초: 간단한 인트로와 콘텐츠 미리보기
3. 본문: 단계별 상세 설명
4. 마무리: 핵심 요약과 다음 영상 예고

시청자 참여를 높이고 끝까지 볼 수 있는 스크립트를 작성해주세요.`,

    'instagram_reel_script': `인스타그램 릴스 스크립트를 작성해주세요.

주제: ${topic}
톤앤매너: ${tone}
${targetAudience ? `타겟 오디언스: ${targetAudience}` : ''}
${additionalInstructions ? `추가 지시사항: ${additionalInstructions}` : ''}

구성 가이드라인:
1. 0-3초: 강력한 훅으로 시작
2. 본문: 빠른 전환으로 정보 전달
3. 마지막: 저장/공유 유도하는 마무리
4. 15-60초 길이
5. 텍스트 오버레이 내용 포함

시각적으로 매력적이고 바이럴 가능성이 높은 스크립트를 작성해주세요.`,

    'facebook_post': `Facebook 포스트를 작성해주세요.

주제: ${topic}
톤앤매너: ${tone}
${targetAudience ? `타겟 오디언스: ${targetAudience}` : ''}
${additionalInstructions ? `추가 지시사항: ${additionalInstructions}` : ''}

작성 가이드라인:
1. 개인적이고 친근한 톤
2. 스토리텔링 중심
3. 공감대 형성하는 내용
4. 자연스러운 대화 유도
5. 적절한 이모지 사용
6. 공유하고 싶은 가치 있는 내용

Facebook 사용자들이 좋아하고 공유하고 싶어하는 콘텐츠를 작성해주세요.`
  }

  return basePrompts[contentType] || basePrompts['x_post']
}

// 프롬프트 사용 로그 기록
export async function logPromptUsage(
  templateId: string,
  templateName: string,
  templateVersion: number,
  contentId?: string,
  userId?: string,
  inputVariables?: any,
  executionTimeMs?: number,
  success: boolean = true,
  errorMessage?: string,
  generatedContentLength?: number
): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('prompt_usage_logs')
      .insert({
        template_id: templateId,
        template_version: templateVersion,
        template_name: templateName,
        content_id: contentId,
        user_id: userId,
        input_variables: inputVariables || {},
        execution_time_ms: executionTimeMs,
        success,
        error_message: errorMessage,
        generated_content_length: generatedContentLength
      })

    if (error) {
      console.error('❌ Error logging prompt usage:', error)
    } else {
      console.log(`✅ Logged prompt usage for ${templateName}`)
    }
  } catch (error: any) {
    console.error('❌ Error in logPromptUsage:', error)
  }
}