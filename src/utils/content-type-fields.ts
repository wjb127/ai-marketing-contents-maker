// Content type별 특화 필드 정의
// 초간단 구조 유지하면서 타입별 맞춤 변수 지원

export const CONTENT_TYPE_SPECIFIC_FIELDS = {
  // Before/After 대비 템플릿
  'before_after': {
    fields: [
      { key: 'before', label: 'Before (변화 전)', placeholder: '예: 매출 100만원, 스트레스 많음, 비효율적인 방법' },
      { key: 'after', label: 'After (변화 후)', placeholder: '예: 매출 500만원, 스트레스 없음, 효율적인 시스템' },
      { key: 'transformation', label: '변화 과정/방법', placeholder: '예: 마케팅 자동화 도구 도입' }
    ]
  },

  // Hook-공감-해결-CTA 템플릿
  'hook_empathy_solution': {
    fields: [
      { key: 'hook', label: 'Hook (관심 끌기)', placeholder: '예: 혹시 이런 고민 있으세요?' },
      { key: 'pain_point', label: 'Pain Point (공감 포인트)', placeholder: '예: 매일 야근에 시달림' },
      { key: 'solution', label: 'Solution (해결책)', placeholder: '예: 업무 자동화 시스템' },
      { key: 'cta', label: 'CTA (행동 유도)', placeholder: '예: 무료 상담 신청하기' }
    ]
  },

  // 스토리텔링 템플릿  
  'story_telling': {
    fields: [
      { key: 'protagonist', label: '주인공', placeholder: '예: 스타트업 CEO, 직장인, 학생' },
      { key: 'conflict', label: '갈등/문제', placeholder: '예: 자금난, 시간 부족, 경쟁 심화' },
      { key: 'resolution', label: '해결/성과', placeholder: '예: 투자 유치, 효율성 증대, 차별화 성공' },
      { key: 'lesson', label: '교훈/메시지', placeholder: '예: 포기하지 않으면 기회가 온다' }
    ]
  },

  // 리스티클 템플릿
  'listicle': {
    fields: [
      { key: 'list_count', label: '항목 수', placeholder: '예: 5가지, 10가지, 7가지' },
      { key: 'category', label: '카테고리', placeholder: '예: 마케팅 전략, 생산성 도구, 투자 방법' },
      { key: 'criteria', label: '선정 기준', placeholder: '예: 실제 효과, 사용 편의성, 가성비' }
    ]
  },

  // 영웅 서사 템플릿
  'hero_journey': {
    fields: [
      { key: 'ordinary_world', label: '평범한 일상', placeholder: '예: 일반적인 직장인 생활' },
      { key: 'call_to_adventure', label: '모험의 부름', placeholder: '예: 창업 아이디어, 새로운 기회' },
      { key: 'transformation', label: '변화/성장', placeholder: '예: 실패를 통한 학습, 새로운 능력 습득' },
      { key: 'return', label: '귀환/성공', placeholder: '예: 성공한 사업가, 전문가가 됨' }
    ]
  },

  // 통념 깨기 템플릿
  'myth_buster': {
    fields: [
      { key: 'common_belief', label: '일반적인 통념', placeholder: '예: 돈 많이 있어야 투자 시작 가능' },
      { key: 'reality', label: '실제 현실', placeholder: '예: 소액으로도 충분히 시작 가능' },
      { key: 'evidence', label: '근거/사례', placeholder: '예: 월 10만원 적립식 펀드로 시작한 사례' }
    ]
  },

  // A vs B 비교 템플릿
  'comparison': {
    fields: [
      { key: 'option_a', label: '선택지 A', placeholder: '예: 전통적인 방법, 기존 도구, 옛날 방식' },
      { key: 'option_b', label: '선택지 B', placeholder: '예: 혁신적인 방법, 새로운 도구, 최신 방식' },
      { key: 'comparison_criteria', label: '비교 기준', placeholder: '예: 비용, 시간, 효율성, 결과' }
    ]
  },

  // 감정 공감 템플릿
  'emotional_empathy': {
    fields: [
      { key: 'emotion', label: '타겟 감정', placeholder: '예: 불안, 좌절, 외로움, 스트레스' },
      { key: 'situation', label: '상황/맥락', placeholder: '예: 직장에서, 사업하면서, 관계에서' },
      { key: 'comfort', label: '위로/격려', placeholder: '예: 당신만 그런 게 아니에요, 충분히 잘하고 있어요' }
    ]
  },

  // 도발적 질문 템플릿
  'provocative_question': {
    fields: [
      { key: 'challenge_question', label: '도발적 질문', placeholder: '예: 정말 지금 하는 일이 당신이 원하는 삶인가요?' },
      { key: 'uncomfortable_truth', label: '불편한 진실', placeholder: '예: 대부분의 사람들은 안전지대에서 벗어나지 못함' },
      { key: 'action_prompt', label: '행동 촉구', placeholder: '예: 지금 당장 한 가지라도 바꿔보세요' }
    ]
  },

  // 팩트 폭격 템플릿
  'fact_bombardment': {
    fields: [
      { key: 'shocking_stat', label: '충격적인 통계', placeholder: '예: 90%의 스타트업이 3년 내 망함' },
      { key: 'context', label: '맥락/배경', placeholder: '예: 한국 창업 생태계에서' },
      { key: 'implication', label: '의미/시사점', placeholder: '예: 준비 없는 창업은 위험하다' }
    ]
  },

  // 기본 타입들 (기존 유지)
  'x_post': {
    fields: [
      { key: 'hashtags', label: '해시태그', placeholder: '예: #마케팅 #SNS #팁' }
    ]
  },

  'thread': {
    fields: [
      { key: 'thread_count', label: '트윗 개수', placeholder: '예: 5개, 7개' }
    ]
  },

  'blog_post': {
    fields: [
      { key: 'seo_keywords', label: 'SEO 키워드', placeholder: '예: 디지털마케팅, 콘텐츠전략' }
    ]
  },

  'youtube_script': {
    fields: [
      { key: 'video_length', label: '영상 길이', placeholder: '예: 5분, 10분' },
      { key: 'intro_hook', label: '인트로 훅', placeholder: '예: 오늘 알려드릴 내용은...' }
    ]
  },

  'instagram_reel_script': {
    fields: [
      { key: 'visual_concept', label: '비주얼 컨셉', placeholder: '예: Before/After 화면 전환' },
      { key: 'trending_sound', label: '트렌딩 사운드', placeholder: '예: 인기 BGM, 효과음' }
    ]
  },

  'linkedin_post': {
    fields: [
      { key: 'professional_insight', label: '전문적 인사이트', placeholder: '예: 업계 트렌드, 경험 공유' }
    ]
  },

  'facebook_post': {
    fields: [
      { key: 'engagement_type', label: '참여 유도 방식', placeholder: '예: 투표, 댓글 질문, 공유 요청' }
    ]
  }
} as const

// 타입별 필드 가져오기 헬퍼 함수
export function getFieldsForContentType(contentType: string) {
  return CONTENT_TYPE_SPECIFIC_FIELDS[contentType as keyof typeof CONTENT_TYPE_SPECIFIC_FIELDS]?.fields || []
}

// 프롬프트 생성 헬퍼 함수  
export function buildPromptWithSpecificFields(
  contentType: string,
  tone: string, 
  topic: string,
  targetAudience: string,
  additionalInstructions: string,
  specificFields: Record<string, string>
) {
  let prompt = `content_type: ${contentType}
tone: ${tone}
topic: ${topic}`

  if (targetAudience) {
    prompt += `\ntarget_audience: ${targetAudience}`
  }

  // 타입별 특화 필드 추가
  const fields = getFieldsForContentType(contentType)
  if (fields.length > 0) {
    prompt += '\n\n--- Content Type Specific Parameters ---'
    fields.forEach(field => {
      if (specificFields[field.key]) {
        prompt += `\n${field.key}: ${specificFields[field.key]}`
      }
    })
  }

  if (additionalInstructions) {
    prompt += `\n\nadditional_instructions: ${additionalInstructions}`
  }

  return prompt
}