import { ContentType, ContentTone } from '@/types'
import { CONTENT_TYPE_SPECS } from '@/utils/constants'

// 훅 타입 정의
type HookType = 'strong_recommend' | 'warning' | 'practical'

// 강조 표현 풀 (톤별 구분)
const EMPHASIS_EXPRESSIONS = {
  professional: [
    '중요한 사실은',
    '주목해야 할 점은',
    '핵심 요소는',
    '결정적 차이는',
    '가장 효과적인 방법은',
    '검증된 접근법은',
    '업계 표준은',
    '실제 데이터에 따르면',
  ],
  casual: [
    '외우세요',
    '기억하세요',
    '꼭 명심하세요',
    '무조건 ~하세요',
    '절대 ~하지 마세요',
    '이건 진짜 금물',
    '놓치면 후회합니다',
    '이것만 알아도 성공',
  ]
}

// 경험담 어투 풀
const EXPERIENCE_TONES = [
  '종종 ~에서 발견되곤 합니다',
  '자주 보는 실수가',
  '현장에서 많이 겪는',
  '실제로 경험해보니',
  '많은 분들이 놓치는',
  '의외로 모르시는',
  '제가 직접 겪은',
  '10년 경험상',
]

// 마무리 표현 풀
const CLOSING_EXPRESSIONS = [
  { type: 'emotional', text: '결국 ~가 가장 중요하더라구요', emoji: '🥲' },
  { type: 'emotional', text: '이제 알았으니 늦지 않았어요', emoji: '💪' },
  { type: 'perspective', text: '억대 매출 회사도 이것부터 시작했습니다' },
  { type: 'perspective', text: '작은 변화가 큰 결과를 만듭니다' },
  { type: 'summary', text: '이렇게 하면 ~이 최소 50% 개선됩니다' },
  { type: 'summary', text: '단 3개월이면 완전히 달라집니다' },
]

// 톤별 상세 설정
const TONE_DETAILS = {
  professional: {
    title: '전문가 분석형',
    description: '객관적이고 체계적인 전문성',
    opening: '업계 {experience}년 경험에 따르면',
    style: '~습니다체',
  },
  casual: {
    title: '친구 조언형',
    description: '편안하고 공감적',
    opening: '나도 그랬는데, 이렇게 하니까 진짜',
    style: '~해요체',
  },
  humorous: {
    title: '도발적 챌린저형',
    description: '기존 상식에 도전',
    opening: '모두가 믿는 이 상식, 완전히 틀렸습니다',
    style: '~다체',
  },
  inspirational: {
    title: '스토리텔러형',
    description: '서사와 감동',
    opening: '실패했던 그날, 저는 이것을 깨달았습니다',
    style: '~습니다체',
  },
}

// 랜덤 선택 헬퍼 함수
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

// 랜덤으로 n개 선택 헬퍼 함수
function getRandomElements<T>(array: T[], n: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, n)
}

export function getImprovedPromptTemplate(
  contentType: ContentType,
  tone: ContentTone,
  topic: string,
  length: string,
  targetAudience?: string,
  includeHashtags?: boolean,
  additionalNotes?: string
): string {
  const spec = CONTENT_TYPE_SPECS[contentType]
  const toneDetail = TONE_DETAILS[tone] || TONE_DETAILS.professional
  
  let basePrompt = ''
  
  switch (contentType) {
    case 'thread':
      const randomHookType = getRandomElement(['strong_recommend', 'warning', 'practical'])
      const emphasisPool = EMPHASIS_EXPRESSIONS[tone] || EMPHASIS_EXPRESSIONS.casual
      const randomEmphasis = getRandomElements(emphasisPool, 2)
      const randomExperience = getRandomElements(EXPERIENCE_TONES, 1)
      const randomClosing = getRandomElement(CLOSING_EXPRESSIONS)
      
      // 톤별 구체적 작성 지침
      const toneSpecificGuidance = tone === 'professional' ? `
[Professional 톤 특별 지침]
- 개인 경험담보다는 객관적 사실과 업계 동향 중심
- "저는~", "제가~" 대신 "일반적으로", "현실적으로", "업계에서는" 사용
- 구체적 수치, 사례, 도구명으로 전문성 강조
- 감정적 표현보다는 논리적이고 체계적인 설명
- 각 팁마다 '왜 그런지' 이유와 배경 설명 포함` : ''
      
      basePrompt = `다음 조건에 맞춰 X(트위터) 스레드를 작성해주세요:

주제: ${topic}
${targetAudience ? `타겟: ${targetAudience}` : ''}

[제목과 내용 일관성 확보]
${randomHookType === 'strong_recommend' ? `- 제목: "${topic} 무조건 알아야 하는 ${Math.floor(Math.random() * 3) + 3}가지"
- 내용: 제목에서 약속한 정확한 개수만큼 구체적 방법론 제시` : ''}
${randomHookType === 'warning' ? `- 제목: "${topic} 이렇게 하면 망합니다" 
- 내용: 실제 실패 사례와 구체적 해결책 함께 제시` : ''}
${randomHookType === 'practical' ? `- 제목: "${topic} 10배 쉽게 하는 방법"
- 내용: 기존 방법 대비 확실히 효율적인 구체적 방법론` : ''}

[체계적 구조화]
1. 훅: 제목과 완전히 일치하는 오프닝
2. 본문: ${length === 'short' ? '3-4개' : length === 'medium' ? '5-6개' : '7-8개'} 항목을 논리적 순서로 배치
   - 각 항목마다 구체적 예시 + 적용 방법 + 예상 결과
   - 실제 도구명/브랜드명/수치 포함으로 실용성 확보
   - 항목 간 연결성과 흐름 고려
3. 마무리: 실행 가능한 첫 단계 제안

${toneSpecificGuidance}

[내용 깊이 강화]
- 각 팁마다 최소 2-3문장으로 충분한 설명
- "왜 효과적인지" 원리나 이유 설명 포함
- 바로 적용할 수 있는 구체적 액션 아이템
- 일반론 대신 특정 상황별 구체적 가이드

톤: ${toneDetail.description} / ${toneDetail.style} 일관성 유지
각 트윗 280자 이내, 전체 ${length === 'short' ? '5개' : length === 'medium' ? '6-7개' : '8-10개'} 트윗

❌ 절대 금지사항 (AI 티 완전 제거):
- 마크다운 문법 및 구조적 표현 금지
- 번호 매기기 대신 자연스러운 순서 표현 ("먼저", "그 다음", "마지막으로")
- 체크마크(✓), 불릿(-) 완전 금지
- AI 어투 ("핵심은", "포인트는", "요약하면") 금지
- 완벽한 문법보다 자연스러운 구어체
- 실제 사람이 연속 트윗하듯 자연스럽게 연결`
      break
      
    case 'x_post':
      const postHookType = getRandomElement(['strong_recommend', 'warning', 'practical'])
      const postEmphasisPool = EMPHASIS_EXPRESSIONS[tone] || EMPHASIS_EXPRESSIONS.casual
      const postEmphasis = getRandomElement(postEmphasisPool)
      
      // 톤별 구체적 작성 지침
      const postToneGuidance = tone === 'professional' ? `
[Professional 톤 지침]
- 업계 표준이나 통계 데이터 활용
- 전문 용어는 간단한 설명과 함께
- 객관적 근거 기반으로 신뢰성 확보
- 개인 의견보다는 검증된 사실 중심` : ''
      
      basePrompt = `다음 조건으로 X(트위터) 게시물을 작성해주세요:

주제: ${topic}
${targetAudience ? `타겟: ${targetAudience}` : ''}

[제목-내용 일관성 보장]
${postHookType === 'strong_recommend' ? `훅: "${topic} 하는 사람이 꼭 알아야 할 팩트"
→ 내용: 정말 중요하고 검증된 핵심 사실들만` : ''}
${postHookType === 'warning' ? `훅: "${topic} 실패하는 사람들의 공통점"
→ 내용: 실제 실패 사례 기반 구체적 주의사항` : ''}
${postHookType === 'practical' ? `훅: "${topic} 10배 쉽게 하는 방법"
→ 내용: 기존 방식 대비 명확히 효율적인 방법` : ''}

[체계적 내용 구성]
- 핵심 포인트 3개를 논리적 순서로 배치
- 각 포인트마다 구체적 예시나 수치 포함
- 포인트 간 연결성 있게 구성
- 실행 가능한 구체적 조언

${postToneGuidance}

[깊이 있는 설명]
- 각 포인트를 단순 나열이 아닌 설명과 함께
- "왜 중요한지" 이유 포함
- 바로 적용 가능한 실용적 팁
- 일반론 대신 구체적 상황별 가이드

[자연스러운 마무리]
- 독자 참여 유도하는 구체적 질문
- 경험 공유나 의견 요청
- 억지스럽지 않게 자연스럽게

톤: ${toneDetail.description} 일관성 유지
길이: 280자 이내

❌ AI 티 완전 제거:
- 구조적 표현 (✓, -, **, 번호) 절대 금지
- "포인트는", "핵심은", "정리하면" AI 어투 금지
- 자연스러운 흐름과 구어체 느낌
- 완벽한 문법보다 진짜 사람이 쓴 느낌

${includeHashtags ? '해시태그: 콘텐츠와 자연스럽게 연결되는 2-3개' : ''}`
      break
      
    case 'blog_post':
      basePrompt = `다음 조건으로 블로그 포스트를 작성해주세요:

주제: ${topic}
${targetAudience ? `타겟 독자: ${targetAudience}` : ''}

[제목]
SEO 최적화 + 클릭 유도하는 제목
"[2024] ${topic} 완벽 가이드" 형식 피하고 독창적으로

[도입부 - HOOK]
${toneDetail.opening.replace('{experience}', '10').replace('{field}', '이 분야')}
독자가 계속 읽고 싶게 만드는 스토리나 통계

[본문 구조 - STORY]
1. 문제 정의 (독자가 겪는 어려움)
2. 해결책 제시 (단계별 가이드)
   - 각 단계마다 실제 사례
   - 구체적 수치와 결과
3. 실전 팁 (바로 적용 가능한)
4. 주의사항 (흔한 실수들)

[마무리 - OFFER]
• 핵심 요약 (불릿 포인트)
• 다음 단계 제안
• "더 깊은 내용은 뉴스레터에서" 유도

길이: ${length === 'short' ? '800-1000자' : length === 'medium' ? '1200-1500자' : '2000-2500자'}
톤: ${toneDetail.style}로 전문성과 친근함 균형`
      break
      
    case 'youtube_script':
      const ytHook = getRandomElement([
        '이 영상 끝까지 보면 인생이 바뀝니다',
        '99%가 모르는 ${topic} 비밀',
        '${topic} 때문에 고민이라면 꼭 보세요',
      ])
      
      basePrompt = `YouTube 영상 스크립트를 작성해주세요:

주제: ${topic}
${targetAudience ? `타겟 시청자: ${targetAudience}` : ''}

[0:00-0:15 훅]
"${ytHook.replace('${topic}', topic)}"
시청 지속률 높이는 미리보기

[0:15-0:30 인트로]
• 자기소개는 5초 이내
• 오늘 배울 3가지 명확히
• 구독/좋아요는 자연스럽게

[본문 - ${length === 'short' ? '3-5분' : length === 'medium' ? '7-10분' : '10-15분'}]
1. 스토리텔링으로 시작
2. 단계별 설명 (시각 자료 큐)
3. 실시간 시연이나 예시
4. 시청자 참여 유도 (댓글 질문)

[마무리]
• 핵심 정리 카드
• 다음 영상 예고
• "더 많은 팁은 구독하고 알림 설정"

편집 포인트:
- 중요 부분 자막 강조
- B롤 삽입 타이밍
- 효과음/BGM 큐`
      break
      
    case 'instagram_reel_script':
      basePrompt = `인스타그램 릴스 스크립트를 작성해주세요:

주제: ${topic}
길이: ${length === 'short' ? '15-30초' : length === 'medium' ? '30-45초' : '45-60초'}

[0-3초: 훅]
시각적 충격이나 궁금증 유발
"잠깐! 이거 모르면 손해"

[본문]
• 빠른 전환으로 정보 전달
• 텍스트 오버레이 내용
• 비트에 맞춘 장면 전환

[마지막 3초]
"더 많은 꿀팁은 프로필에서"
저장 유도하는 마지막 컷

캡션:
개인 스토리 + 가치 있는 정보
이모지로 가독성 높이기
${includeHashtags ? '릴스 전용 해시태그 10-15개' : ''}`
      break
      
    case 'linkedin_post':
      basePrompt = `LinkedIn 포스트를 작성해주세요:

주제: ${topic}
${targetAudience ? `타겟: ${targetAudience}` : ''}

[오프닝]
"${toneDetail.opening.replace('{experience}', '업계 경력 10').replace('{field}', topic)}"
또는 최신 업계 트렌드/통계로 시작

[본문]
• 3-5개 핵심 인사이트
• 각각 실무 사례 포함
• 데이터와 결과로 뒷받침
• 단락은 짧게, 가독성 중시

[마무리]
• 업계 전망이나 조언
• "당신의 경험은 어떤가요?" 
• "이 주제로 대화하고 싶으신 분은 연결 신청 주세요"

톤: 전문적이되 인간적인
이모지: 최소한으로 포인트만
${includeHashtags ? '업계 관련 해시태그 3-5개' : ''}`
      break
      
    case 'facebook_post':
      basePrompt = `Facebook 포스트를 작성해주세요:

주제: ${topic}
${targetAudience ? `타겟: ${targetAudience}` : ''}

[시작]
개인적 경험이나 관찰로 시작
"오늘 ${topic} 하다가 깨달은 것"

[본문]
• 스토리텔링 중심
• 공감 포인트 2-3개
• 구체적 예시와 감정 묘사
• 대화하듯 편안한 톤

[마무리]
• 긍정적 메시지
• "여러분은 어떻게 생각하세요?"
• 공유 유도하는 가치 있는 마무리

길이: ${length === 'short' ? '간단명료' : length === 'medium' ? '적당한 스토리' : '깊이 있는 이야기'}
이모지: 적절히 사용해 친근감 표현`
      break
  }
  
  // 공통 추가사항
  if (additionalNotes) {
    basePrompt += `\n\n추가 요구사항: ${additionalNotes}`
  }
  
  basePrompt += `\n\n🚨 중요 작성 원칙: 
- 마크다운 문법 절대 사용 금지 (**, *, #, -, 등)
- 구조적 번호 매기기 금지 ("1번", "첫 번째" 등)
- 체크마크(✓) 절대 사용 금지
- "핵심은", "포인트는", "요약하면" 같은 AI 어투 금지
- 실제 사람이 경험담 말하듯 자연스럽게
- 완벽한 문법보다 살짝 어긋나는 구어체
- 감정 표현과 개인적 실수담 포함

올바른 예시:
❌ 잘못된 형태: "**1번 트윗 (훅)**"
✅ 올바른 형태: "개발자 밈 이렇게 쓰면 망합니다"

❌ 잘못된 형태: "- 첫 번째 포인트"  
✅ 올바른 형태: "진짜 문제는 이거예요"`
  
  return basePrompt
}

// 스케줄링용 간소화 버전
export function getScheduledPromptTemplate(
  contentType: string,
  tone: string,
  topic: string,
  targetAudience?: string,
  additionalInstructions?: string
): string {
  // ContentType 타입 체크 및 변환
  const validContentType = contentType as ContentType
  const validTone = tone as ContentTone
  
  return getImprovedPromptTemplate(
    validContentType,
    validTone,
    topic,
    'medium',
    targetAudience,
    true,
    additionalInstructions
  )
}