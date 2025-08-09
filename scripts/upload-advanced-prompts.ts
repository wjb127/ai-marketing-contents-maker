/**
 * 고급 프롬프트 템플릿을 관리자 API를 통해 업로드하는 스크립트
 * /api/admin/prompts API를 활용하여 STICK 원칙과 HSO 프레임워크가 적용된 
 * 바이럴 최적화 템플릿들을 데이터베이스에 등록
 */

// 고급 프롬프트 템플릿 데이터
const ADVANCED_TEMPLATES = [
  {
    name: 'X 포스트 기본 템플릿',
    title: 'X 포스트 기본 템플릿 v2',
    description: 'STICK 원칙과 HSO 프레임워크를 적용한 고급 X 포스트 생성 템플릿. AI 탐지 방지 및 바이럴 최적화 포함',
    template: `다음 조건으로 X(트위터) 게시물을 작성해주세요:

주제: {topic}
톤앤매너: {tone}
타겟: {target_audience}
추가 지시사항: {additional_instructions}

[제목-내용 일관성 보장]
다음 중 하나의 훅 스타일 선택:
• 강력추천형: "{topic} 하는 사람이 꼭 알아야 할 팩트"
• 경고형: "{topic} 실패하는 사람들의 공통점"  
• 실용형: "{topic} 10배 쉽게 하는 방법"

[체계적 내용 구성]
- 핵심 포인트 3개를 논리적 순서로 배치
- 각 포인트마다 구체적 예시나 수치 포함
- 포인트 간 연결성 있게 구성
- 실행 가능한 구체적 조언

[Professional 톤 특별 지침 - {tone}이 'professional'인 경우]
- 업계 표준이나 통계 데이터 활용
- 전문 용어는 간단한 설명과 함께
- 객관적 근거 기반으로 신뢰성 확보
- 개인 의견보다는 검증된 사실 중심

[깊이 있는 설명]
- 각 포인트를 단순 나열이 아닌 설명과 함께
- "왜 중요한지" 이유 포함
- 바로 적용 가능한 실용적 팁
- 일반론 대신 구체적 상황별 가이드

[자연스러운 마무리]
- 독자 참여 유도하는 구체적 질문
- 경험 공유나 의견 요청
- 억지스럽지 않게 자연스럽게

길이: 280자 이내
톤 일관성: {tone}에 맞게 전체적으로 통일

🚨 AI 탐지 방지 필수 사항:
- 구조적 표현 (✓, -, **, 번호) 절대 금지
- "포인트는", "핵심은", "정리하면" AI 어투 금지
- 자연스러운 흐름과 구어체 느낌
- 완벽한 문법보다 진짜 사람이 쓴 느낌
- 마크다운 문법 절대 사용 금지`,
    variables: ['topic', 'tone', 'target_audience', 'additional_instructions'],
    content_type: 'x_post'
  },

  {
    name: '스레드 기본 템플릿',
    title: '스레드 기본 템플릿 v2',
    description: 'STICK 원칙과 바이럴 스레드 패턴을 적용한 고급 스레드 생성 템플릿. 강력한 훅과 자연스러운 연결 구조',
    template: `다음 조건에 맞춰 X(트위터) 스레드를 작성해주세요:

주제: {topic}
톤앤매너: {tone}
타겟: {target_audience}
추가 지시사항: {additional_instructions}

[제목과 내용 일관성 확보]
다음 중 하나의 훅 스타일로 시작:
• 강력추천형: "{topic} 무조건 알아야 하는 3-5가지"
• 경고형: "{topic} 이렇게 하면 망합니다"
• 실용형: "{topic} 10배 쉽게 하는 방법"

[체계적 구조화]
1. 훅: 제목과 완전히 일치하는 오프닝 (첫 번째 트윗)
2. 본문: 5-7개 항목을 논리적 순서로 배치
   - 각 항목마다 구체적 예시 + 적용 방법 + 예상 결과
   - 실제 도구명/브랜드명/수치 포함으로 실용성 확보
   - 항목 간 연결성과 흐름 고려
3. 마무리: 실행 가능한 첫 단계 제안

[Professional 톤 특별 지침 - {tone}이 'professional'인 경우]
- 개인 경험담보다는 객관적 사실과 업계 동향 중심
- "저는~", "제가~" 대신 "일반적으로", "현실적으로", "업계에서는" 사용
- 구체적 수치, 사례, 도구명으로 전문성 강조
- 감정적 표현보다는 논리적이고 체계적인 설명
- 각 팁마다 '왜 그런지' 이유와 배경 설명 포함

[내용 깊이 강화]
- 각 팁마다 최소 2-3문장으로 충분한 설명
- "왜 효과적인지" 원리나 이유 설명 포함
- 바로 적용할 수 있는 구체적 액션 아이템
- 일반론 대신 특정 상황별 구체적 가이드

[자연스러운 연결과 강조]
- 강조 표현 활용: "외우세요", "꼭 기억하세요", "무조건 ~하세요"
- 경험담 어투: "종종 ~에서 발견되곤 합니다", "실제로 경험해보니"
- 트윗 간 자연스러운 연결어 사용

각 트윗 280자 이내, 전체 6-8개 트윗
톤 일관성: {tone}에 맞게 스타일 통일

🚨 AI 탐지 방지 핵심 사항:
- 마크다운 문법 및 구조적 표현 금지
- 번호 매기기 대신 자연스러운 순서 표현 ("먼저", "그 다음", "마지막으로")
- 체크마크(✓), 불릿(-) 완전 금지
- AI 어투 ("핵심은", "포인트는", "요약하면") 금지
- 완벽한 문법보다 자연스러운 구어체
- 실제 사람이 연속 트윗하듯 자연스럽게 연결`,
    variables: ['topic', 'tone', 'target_audience', 'additional_instructions'],
    content_type: 'thread'
  },

  {
    name: '블로그 포스트 기본 템플릿',
    title: '블로그 포스트 기본 템플릿 v2', 
    description: 'HSO 프레임워크와 STICK 원칙을 적용한 블로그 포스트 생성 템플릿. SEO 최적화와 독자 참여도 극대화',
    template: `다음 조건으로 블로그 포스트를 작성해주세요:

주제: {topic}
톤앤매너: {tone}
타겟 독자: {target_audience}
추가 지시사항: {additional_instructions}

[HSO 프레임워크 적용]

[HOOK - 강력한 도입부]
다음 중 하나의 방식으로 시작:
• 충격적 통계: "90%가 모르는 {topic}의 진실"
• 개인 실패담: "{topic} 때문에 큰 손해를 본 이야기"
• 반전 시작: "모두가 믿는 {topic} 상식, 완전히 틀렸습니다"

[STORY - 체계적 본문 전개]
1. 문제 정의 (독자가 겪는 현실적 어려움)
   - 구체적 사례와 상황 묘사
   - 통계나 설문 결과로 뒷받침

2. 해결책 제시 (단계별 실용적 가이드)
   - 각 단계마다 실제 사례와 결과 포함
   - 구체적 수치와 도구명 활용
   - "왜 이 방법이 효과적인지" 원리 설명

3. 실전 적용 팁 (바로 실행 가능한)
   - 초보자도 따라 할 수 있는 구체적 방법
   - 예상되는 결과와 시간 프레임
   - 실제 적용 사례 공유

4. 주의사항 및 함정 (흔한 실수들)
   - 실패 사례와 원인 분석
   - 피해야 할 구체적 행동들

[OFFER - 가치 있는 마무리]
• 핵심 요약 (3-5개 주요 포인트)
• 독자 액션 플랜 (다음에 할 일)
• 커뮤니티 참여 유도 ("경험 공유해 주세요")

[톤별 맞춤 작성 지침]
{tone}이 'professional'인 경우:
- 데이터와 연구 결과 중심
- 객관적이고 분석적 접근
- 업계 표준과 모범 사례 제시

{tone}이 'casual'인 경우:
- 개인 경험과 솔직한 후기 중심
- 친근하고 공감할 수 있는 톤
- 실생활 예시와 유머 적절히 활용

길이: 1200-2000자 (읽기 좋은 분량)
문단: 3-4문장씩 짧게 나누어 가독성 확보

🚨 자연스러운 글쓰기 필수사항:
- 서론-본론-결론 딱딱한 구조 피하기
- 소제목은 궁금증 유발하는 문장형으로
- 마크다운 헤딩 대신 자연스러운 문단 전환
- AI 같은 완벽한 구조보다 사람다운 흐름
- "정리하자면", "결론적으로" 같은 정형화된 표현 피하기`,
    variables: ['topic', 'tone', 'target_audience', 'additional_instructions'],
    content_type: 'blog_post'
  },

  {
    name: 'YouTube 스크립트 기본 템플릿',
    title: 'YouTube 스크립트 기본 템플릿 v2',
    description: 'YouTube 알고리즘 최적화와 시청자 몰입도를 고려한 영상 스크립트 템플릿. 훅-본문-마무리 구조',
    template: `YouTube 영상 스크립트를 작성해주세요:

주제: {topic}
톤앤매너: {tone}  
타겟 시청자: {target_audience}
추가 지시사항: {additional_instructions}

[0:00-0:15 강력한 훅 (시청 지속률 최대화)]
다음 중 하나의 방식으로 시작:
• 경고형: "이 영상 끝까지 안 보면 {topic}에서 큰 손해 봅니다"
• 호기심형: "99%가 모르는 {topic}의 비밀"
• 문제제기형: "{topic} 때문에 고민이라면 꼭 보세요"

시작 3초 안에 핵심 가치 제시
미리보기: "이 영상에서 배울 3가지는..."

[0:15-0:30 자연스러운 인트로]
• 간단 인사와 채널 소개 (5초 이내)
• 오늘 배울 내용 구체적 예고
• 구독/좋아요는 자연스럽게 ("도움이 된다면...")

[본문 구성 - 몰입도 유지 전략]
1. 스토리텔링으로 시작
   - 개인 경험이나 실제 사례
   - 시청자가 공감할 수 있는 상황

2. 핵심 내용 단계별 설명
   - 각 단계마다 시각 자료 큐 표시 [화면: 그래프/이미지]
   - 구체적 수치와 예시로 설명
   - "잠깐, 이건 정말 중요해요" 같은 주의 환기

3. 실시간 시연이나 데모
   - 실제 화면 녹화나 예시 보여주기
   - 시청자와 함께하는 느낌 연출

4. 시청자 참여 유도
   - "댓글에 여러분 경험 공유해 주세요"
   - "어떤 부분이 가장 도움 되었나요?"

[마무리 - 재시청과 구독 유도]
• 핵심 정리 (3개 포인트 요약 카드)
• 다음 영상 자연스러운 예고
• "더 많은 {topic} 팁은 구독하고 알림 설정해 주세요"

[편집 가이드]
- 중요 부분 자막 강조 표시
- B롤 삽입 타이밍: [B롤: 관련 영상/이미지]
- 효과음/BGM 큐: [음향: 긴장감/경쾌함]
- 화면 전환 포인트 표시

예상 길이: 8-12분 (시청자 집중도 고려)
톤 일관성: {tone}에 맞는 말투와 에너지 유지

🚨 YouTube 최적화 핵심:
- 첫 15초가 생명, 강력한 훅 필수
- 3분마다 새로운 관심 포인트 제공
- "잠깐", "그런데", "더 중요한 건" 같은 관심 끌기
- 완벽한 대본보다 자연스러운 말하기 톤
- 시청자와 대화하는 느낌 유지`,
    variables: ['topic', 'tone', 'target_audience', 'additional_instructions'],
    content_type: 'youtube_script'
  },

  {
    name: '인스타그램 릴 기본 템플릿',
    title: '인스타그램 릴 기본 템플릿 v2',
    description: '인스타그램 릴스 알고리즘과 바이럴 요소를 최적화한 짧은 영상 스크립트 템플릿. 3초 훅과 저장 유도 전략',
    template: `인스타그램 릴스 스크립트를 작성해주세요:

주제: {topic}
톤앤매너: {tone}
타겟 오디언스: {target_audience}
추가 지시사항: {additional_instructions}

[0-3초: 스크롤 멈추는 훅]
시각적 충격과 궁금증 유발:
• "잠깐! 이거 모르면 {topic}에서 손해"
• "이 3가지만 알면 {topic} 완전 달라짐"
• "다들 틀리게 하고 있는 {topic} 방법"

[텍스트 오버레이: 굵은 글씨로 임팩트 있게]

[3-15초: 빠른 정보 전달]
리듬감 있는 전개:
1. 첫 번째 팁 (3-4초)
   - 텍스트 + 비주얼 동시 전달
   - [화면: 관련 이미지/애니메이션]

2. 두 번째 팁 (3-4초)  
   - 빠른 컷 전환
   - 핵심만 압축적으로

3. 세 번째 팁 (3-4초)
   - 가장 강력한 팁 마지막에
   - "이건 진짜 꿀팁" 강조

[15-30초: 심화 설명 (Medium/Long형)]
• 각 팁의 구체적 적용 방법
• 실제 결과나 before/after
• 시청자 공감 포인트 추가

[마지막 3초: 강력한 CTA]
• "더 많은 꿀팁은 프로필 링크에서"
• "저장하고 팔로우까지 부탁드려요"
• "댓글로 궁금한 거 물어보세요"

[캡션 작성 가이드]
개인 스토리로 시작:
"요즘 {topic} 때문에 고민 많으셨죠? 
저도 그랬는데 이 방법들 알고 완전 달라졌어요!"

중간에 가치 있는 추가 정보:
"영상에서 못다한 이야기..."

마무리 참여 유도:
"여러분은 어떤 방법 쓰고 계세요? 댓글로 공유해 주세요!"

[해시태그 전략 - 30개 풀셋 활용]
• 핵심 키워드 해시태그: #{topic} #꿀팁
• 타겟 오디언스: #{target_audience}
• 릴스 전용: #reels #인스타그램 #팔로우
• 니치 키워드: (주제별 세부 태그)

[편집 포인트]
- 비트에 맞춘 빠른 전환 (0.5-1초)
- 텍스트 등장 타이밍과 음성 동기화
- 중요 부분 확대/강조 효과
- 트렌딩 음악 활용 권장

길이: 15-30초 (집중도 최적화)
톤: {tone}에 맞되 에너지 넘치게

🚨 릴스 바이럴 법칙:
- 첫 3초가 전부, 시각적 임팩트 최대화
- 텍스트 + 음성 + 비주얼 3중 전달
- 완벽한 설명보다 궁금증 유발이 우선
- 저장하고 싶은 실용적 가치 필수
- 댓글 유도로 참여도 높이기`,
    variables: ['topic', 'tone', 'target_audience', 'additional_instructions'],
    content_type: 'instagram_reel_script'
  },

  {
    name: 'LinkedIn 포스트 기본 템플릿',
    title: 'LinkedIn 포스트 기본 템플릿 v2',
    description: '비즈니스 네트워킹과 전문성 구축을 위한 LinkedIn 포스트 템플릿. 신뢰도와 참여도 최적화',
    template: `LinkedIn 포스트를 작성해주세요:

주제: {topic}
톤앤매너: {tone}
타겟: {target_audience}
추가 지시사항: {additional_instructions}

[전문가 신뢰도 구축 오프닝]
다음 중 하나의 방식으로 시작:
• 경험 기반: "10년간 {topic} 분야에서 일하며 깨달은 것"
• 트렌드 분석: "최근 {topic} 업계에서 일어나는 변화"
• 데이터 인사이트: "놀라운 {topic} 통계를 발견했습니다"

[전문성과 인간미 균형]
1. 객관적 분석과 인사이트
   - 업계 동향과 데이터 기반 관점
   - 구체적 수치와 사례로 신뢰성 확보
   - "업계에서는", "경험상" 같은 전문가 표현

2. 개인적 경험과 스토리
   - 실제 프로젝트나 고객 사례 (익명화)
   - 실패와 학습 과정의 솔직한 공유
   - "처음엔 이렇게 생각했는데..." 변화 과정

3. 실용적 조언과 액션 아이템
   - 바로 적용할 수 있는 구체적 방법
   - 초보자부터 전문가까지 도움되는 팁
   - 도구나 리소스 추천 (구체적 이름)

[네트워킹과 토론 유도]
• "여러분은 {topic}에서 어떤 경험을 하셨나요?"
• "다른 전문가분들의 의견도 궁금합니다"
• "이 주제로 더 깊이 대화하고 싶으신 분은 연결 신청 주세요"

[LinkedIn 최적화 구조]
- 단락을 2-3문장씩 짧게 나누어 모바일 가독성 확보
- 중요 포인트는 줄바꿈으로 강조
- 이모지는 포인트 표시용으로만 최소 사용 (🔍 📊 💡)

[전문 해시태그 전략]
업계별 핵심 해시태그 3-5개:
• 분야별: #{topic} #비즈니스전략 #리더십
• 플랫폼: #LinkedIn #네트워킹 #커리어
• 타겟: #{target_audience}

예상 길이: 200-300단어 (읽기 적정선)
톤 일관성: 전문적이되 친근하고 접근 가능하게

[Professional 톤 특화 가이드 - {tone}이 'professional'인 경우]
- 데이터와 연구 결과 우선 인용
- 개인 감정보다 객관적 분석에 집중  
- "분석 결과", "연구에 따르면" 같은 근거 기반 표현
- 업계 표준과 베스트 프랙티스 제시

🚨 LinkedIn 성공 원칙:
- 자기자랑보다 가치 제공에 집중
- 완벽한 성공담보다 진짜 경험과 실패담
- 업계 트렌드와 개인 관점의 균형
- 댓글로 이어질 토론거리 제공
- 연결과 네트워킹으로 자연스럽게 유도`,
    variables: ['topic', 'tone', 'target_audience', 'additional_instructions'],
    content_type: 'linkedin_post'
  },

  {
    name: 'Facebook 포스트 기본 템플릿',
    title: 'Facebook 포스트 기본 템플릿 v2',
    description: '페이스북의 친근한 커뮤니티 분위기에 최적화된 포스트 템플릿. 스토리텔링과 공감대 형성 중심',
    template: `Facebook 포스트를 작성해주세요:

주제: {topic}
톤앤매너: {tone}
타겟 오디언스: {target_audience}
추가 지시사항: {additional_instructions}

[친근하고 개인적인 시작]
일상적 관찰이나 경험으로 자연스럽게:
• "오늘 {topic} 하다가 문득 든 생각..."
• "요즘 {topic} 때문에 고민이 많은 친구들 보면서"
• "아이들과 {topic} 이야기하다가 깨달은 것"

[스토리텔링 중심 전개]
1. 구체적 상황과 감정 묘사
   - 시간, 장소, 상황을 생생하게
   - 그때 느꼈던 감정과 생각들
   - "그런데 이상하게도...", "신기하게도..."

2. 발견과 깨달음 과정
   - 예상과 달랐던 부분들
   - 주변 사람들과의 대화나 반응
   - "아하!" 하는 순간의 묘사

3. 교훈이나 인사이트
   - 개인적으로 배운 점
   - 다른 사람들에게도 도움될 것 같은 깨달음
   - 실생활에서 바로 적용할 수 있는 팁

[공감과 연결감 형성]
• 독자들도 비슷한 경험이 있을 법한 포인트
• "여러분도 그런 경험 있으시죠?"
• "저만 그런 건 아니길 바라며..."

[자연스러운 참여 유도]
• "여러분은 어떻게 생각하세요?"
• "비슷한 경험 있으시면 댓글로 공유해 주세요"
• "이 글이 도움 됐다면 친구들에게도 공유해 주세요"

[Facebook 특성에 맞는 요소]
- 감정을 자극하고 공감을 이끄는 내용
- 댓글로 이어질 수 있는 열린 질문
- 공유하고 싶을 만큼 가치 있는 인사이트
- 이모지 적절히 사용해 친근함 표현 😊 💝 🌟

[길이별 맞춤 구성]
짧은 버전: 핵심 스토리 + 간단한 교훈 + 질문
긴 버전: 상세한 상황 묘사 + 과정 + 깨달음 + 적용 방법

톤 일관성: {tone}에 맞되 Facebook의 편안한 분위기 유지

[Casual 톤 최적화 - {tone}이 'casual'인 경우]
- 일상어와 구어체 자연스럽게 사용
- "진짜", "완전", "너무" 같은 강조 표현
- 솔직하고 허심탄회한 감정 표현
- 친구와 대화하는 듯한 편안한 말투

🚨 Facebook 성공 포인트:
- 완벽한 글보다 진솔하고 인간적인 이야기
- 교훈적이되 설교하지 않는 자연스러움
- 개인 경험에서 보편적 가치 찾기
- 댓글과 공유를 자연스럽게 유도
- 감정적 연결과 공감대 형성이 핵심`,
    variables: ['topic', 'tone', 'target_audience', 'additional_instructions'],
    content_type: 'facebook_post'
  }
]

async function uploadAdvancedPrompts() {
  try {
    console.log('🚀 고급 프롬프트 템플릿 업로드 시작...')
    console.log(`📋 총 ${ADVANCED_TEMPLATES.length}개 템플릿 업로드 예정\n`)

    // 개발 서버 URL (포트 3002 사용 중)
    const baseUrl = 'http://localhost:3002'
    let successCount = 0
    let failCount = 0

    for (const template of ADVANCED_TEMPLATES) {
      try {
        console.log(`📝 ${template.name} 업로드 중...`)

        // 먼저 content_type에 맞는 카테고리 ID 찾기
        let categoryId = null
        const categoryMapping = {
          'x_post': '소셜미디어',
          'thread': '소셜미디어', 
          'blog_post': '블로그',
          'youtube_script': '동영상',
          'instagram_reel_script': '소셜미디어',
          'linkedin_post': '소셜미디어',
          'facebook_post': '소셜미디어'
        }

        // 카테고리 조회
        const categoriesResponse = await fetch(`${baseUrl}/api/admin/prompts?active_only=true`)
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          const existingTemplate = categoriesData.templates?.find((t: any) => 
            t.prompt_categories?.name === categoryMapping[template.content_type]
          )
          if (existingTemplate) {
            categoryId = existingTemplate.category_id
          }
        }

        const response = await fetch(`${baseUrl}/api/admin/prompts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: template.name,
            title: template.title,
            description: template.description,
            template: template.template,
            variables: template.variables.reduce((acc: any, variable: string) => {
              acc[variable] = variable === 'topic' ? '주제' :
                              variable === 'tone' ? '톤' :
                              variable === 'target_audience' ? '타겟 독자' :
                              variable === 'additional_instructions' ? '추가 지시사항' : variable
              return acc
            }, {}),
            content_type: template.content_type,
            category_id: categoryId,
            is_active: true,
            is_default: true
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error(`❌ ${template.name} 업로드 실패:`, errorData.error)
          failCount++
          continue
        }

        const result = await response.json()
        console.log(`✅ ${template.name} v${result.template.version} 성공!`)
        console.log(`   - ID: ${result.template.id}`)
        console.log(`   - 변수: ${template.variables.join(', ')}`)
        console.log(`   - 길이: ${template.template.length}자\n`)
        successCount++
        
        // API 부하 방지를 위한 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error: any) {
        console.error(`❌ ${template.name} 업로드 중 오류:`, error.message)
        failCount++
      }
    }

    console.log('\n🎉 프롬프트 템플릿 업로드 완료!')
    console.log(`📊 성공: ${successCount}개, 실패: ${failCount}개`)

    if (successCount > 0) {
      console.log('\n💡 다음 단계 권장사항:')
      console.log('1. http://localhost:3002/content/generate 에서 새 템플릿 테스트')
      console.log('2. 관리자 페이지에서 템플릿 상태 확인')  
      console.log('3. 기존 템플릿 대비 성능 비교 테스트')
      console.log('4. 사용자 피드백 수집 및 개선사항 반영')
    }

    if (failCount > 0) {
      console.log('\n⚠️  실패한 템플릿들을 수동으로 확인해 주세요.')
    }

  } catch (error: any) {
    console.error('❌ 전체 업로드 프로세스 실패:', error.message)
    process.exit(1)
  }
}

// 스크립트 실행
if (require.main === module) {
  uploadAdvancedPrompts()
}

export { uploadAdvancedPrompts, ADVANCED_TEMPLATES }