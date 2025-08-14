'use client'

import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Grid,
  Card,
  CardBody,
  useToast,
  Button,
  Textarea,
  Badge,
  Divider,
  Progress,
  Flex,
  Spacer,
  Collapse,
  useBreakpointValue,
  IconButton,
} from '@chakra-ui/react'
import { Star, TrendingUp, Copy, ChevronUp, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import Layout from '@/components/layout/Layout'
import ContentForm, { ContentFormData } from '@/components/content/ContentForm'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { CONTENT_TYPE_LABELS } from '@/utils/constants'
import { useContents } from '@/hooks/useContents'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { ContentType, ContentTone } from '@/types'

interface GeneratedContent {
  content: string
  contentType: string
  tone: string
  topic: string
  wordCount: number
  estimatedReadTime: number
  metadata: {
    targetAudience?: string
    length?: string
  }
  savedContentId?: string
}

interface EvaluationResult {
  rating: number
  feedback: string
  criteria: {
    relevance: number
    quality: number
    engagement: number
    creativity: number
    clarity: number
    tone_accuracy: number
  }
}

export default function CreateContentPage() {
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const { createContent, saveContent } = useContents()
  const toast = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [isCopying, setIsCopying] = useState(false)
  const [isFormCollapsed, setIsFormCollapsed] = useState(false)
  const [isImprovingWithFeedback, setIsImprovingWithFeedback] = useState(false)
  const isMobile = useBreakpointValue({ base: true, lg: false })

  const handleGenerateContent = async (data: ContentFormData) => {
    setIsGenerating(true)
    setGeneratedContent(null)
    setEvaluation(null)

    try {
      const result = await createContent({
        type: data.contentType,
        tone: data.tone,
        topic: data.topic,
        additional_instructions: data.additionalNotes,
        creativityLevel: data.creativityLevel,
        temperature: data.temperature,
        top_p: data.top_p
      })
      
      const formattedResult = {
        content: result.content,
        contentType: result.type,
        tone: result.tone,
        topic: result.topic,
        wordCount: result.content.split(/\s+/).length,
        estimatedReadTime: Math.ceil(result.content.split(/\s+/).length / 200),
        metadata: {
          length: 'medium'
        },
        savedContentId: result.id
      }
      
      setGeneratedContent(formattedResult)
      
      // 모바일에서 콘텐츠 생성 시 폼 자동 접기
      if (isMobile) {
        setIsFormCollapsed(true)
      }
      
      toast({
        title: '콘텐츠 생성 완료!',
        description: 'AI가 생성한 콘텐츠를 확인하고 저장하세요.',
        status: 'success',
        duration: 3000,
      })
    } catch (error: any) {
      toast({
        title: '콘텐츠 생성 실패',
        description: error.message || '콘텐츠 생성 중 오류가 발생했습니다. 다시 시도해주세요.',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveContent = async () => {
    if (!generatedContent) return
    
    setIsSaving(true)
    try {
      await saveContent({
        content: generatedContent.content,
        content_type: generatedContent.contentType as ContentType,
        tone: generatedContent.tone as ContentTone,
        topic: generatedContent.topic,
        status: 'draft'
      })
      
      toast({
        title: '콘텐츠 저장 완료!',
        description: '콘텐츠가 성공적으로 저장되었습니다. 라이브러리에서 확인할 수 있습니다.',
        status: 'success',
        duration: 4000,
      })
    } catch (error: any) {
      toast({
        title: '저장 실패',
        description: error.message || '콘텐츠 저장 중 오류가 발생했습니다.',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEvaluateContent = async () => {
    if (!generatedContent) {
      toast({
        title: '콘텐츠 없음',
        description: '평가할 콘텐츠가 없습니다.',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    setIsEvaluating(true)
    try {
      // 콘텐츠를 먼저 저장
      if (!generatedContent.savedContentId) {
        await handleSaveContent()
        // handleSaveContent가 완료될 때까지 기다리는 대신 직접 API 호출
      }

      const response = await fetch('/api/content/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content_id: generatedContent.savedContentId }),
      })

      if (!response.ok) {
        throw new Error('평가 요청에 실패했습니다')
      }

      const result = await response.json()
      
      setEvaluation({
        rating: result.rating,
        feedback: result.feedback,
        criteria: result.criteria
      })
      
      toast({
        title: 'AI 평가 완료!',
        description: `콘텐츠 평가가 완료되었습니다. 점수: ${result.rating.toFixed(1)}/5`,
        status: 'success',
        duration: 4000,
      })
    } catch (error: any) {
      toast({
        title: '평가 실패',
        description: error.message || 'AI 평가 중 오류가 발생했습니다.',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setIsEvaluating(false)
    }
  }

  const handleCopyContent = async () => {
    if (!generatedContent?.content) return
    
    setIsCopying(true)
    try {
      await navigator.clipboard.writeText(generatedContent.content)
      toast({
        title: '복사 완료!',
        description: '콘텐츠가 클립보드에 복사되었습니다. SNS에 붙여넣기하여 사용하세요.',
        status: 'success',
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: '복사 실패',
        description: '클립보드 복사에 실패했습니다. 텍스트를 직접 선택하여 복사해주세요.',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setIsCopying(false)
    }
  }

  const handleImproveWithFeedback = async () => {
    if (!generatedContent || !evaluation) {
      toast({
        title: '피드백 없음',
        description: '개선할 콘텐츠나 평가 결과가 없습니다.',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    setIsImprovingWithFeedback(true)
    try {
      const response = await fetch('/api/content/improve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_id: generatedContent.savedContentId,
          original_content: generatedContent.content,
          evaluation_feedback: evaluation.feedback,
          evaluation_criteria: evaluation.criteria,
          content_type: generatedContent.contentType,
          tone: generatedContent.tone,
          topic: generatedContent.topic
        }),
      })

      if (!response.ok) {
        throw new Error('콘텐츠 개선 요청에 실패했습니다')
      }

      const result = await response.json()
      
      // 개선된 콘텐츠로 업데이트
      const improvedContent = {
        ...generatedContent,
        content: result.content,
        wordCount: result.content.split(/\s+/).length,
        estimatedReadTime: Math.ceil(result.content.split(/\s+/).length / 200),
        savedContentId: result.id
      }
      
      setGeneratedContent(improvedContent)
      // 기존 평가 결과 초기화 (새로운 콘텐츠이므로)
      setEvaluation(null)
      
      toast({
        title: '콘텐츠 개선 완료!',
        description: 'AI 평가 피드백을 반영하여 콘텐츠가 개선되었습니다.',
        status: 'success',
        duration: 4000,
      })
    } catch (error: any) {
      toast({
        title: '개선 실패',
        description: error.message || '콘텐츠 개선 중 오류가 발생했습니다.',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setIsImprovingWithFeedback(false)
    }
  }

  const renderRatingStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star
            key={i}
            size={16}
            fill="gold"
            color="gold"
          />
        )
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star
            key={i}
            size={16}
            fill="url(#halfGrad)"
            color="gold"
          />
        )
      } else {
        stars.push(
          <Star
            key={i}
            size={16}
            color="gray"
          />
        )
      }
    }

    return stars
  }

  return (
    <ProtectedRoute>
      <Layout>
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading size="xl" mb={2} color="gray.800">
              📝 콘텐츠 생성
            </Heading>
            <Text color="gray.600" fontSize="lg">
              AI를 활용해 소셜미디어용 콘텐츠를 생성하세요
            </Text>
          </Box>

          <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={8}>
            {/* Content Form */}
            <Box>
              <Card>
                <CardBody p={0}>
                  {/* 모바일에서만 표시되는 헤더 */}
                  {isMobile && (
                    <Flex
                      align="center"
                      justify="space-between"
                      p={4}
                      borderBottom="1px solid"
                      borderColor="gray.200"
                      bg="gray.50"
                      cursor="pointer"
                      onClick={() => setIsFormCollapsed(!isFormCollapsed)}
                    >
                      <Box>
                        <Heading size="sm" color="gray.800">새 콘텐츠 생성</Heading>
                        <Text fontSize="xs" color="gray.600">
                          다양한 플랫폼과 형식에 맞는 AI 콘텐츠를 만들어보세요
                        </Text>
                      </Box>
                      <IconButton
                        aria-label={isFormCollapsed ? "폼 열기" : "폼 닫기"}
                        icon={isFormCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                        size="sm"
                        variant="ghost"
                      />
                    </Flex>
                  )}
                  
                  {/* 폼 콘텐츠 */}
                  <Box display={!isMobile ? "block" : undefined}>
                    <Collapse in={!isMobile || !isFormCollapsed} animateOpacity>
                      <Box p={!isMobile ? 0 : 0}>
                        <ContentForm onSubmit={handleGenerateContent} />
                      </Box>
                    </Collapse>
                  </Box>
                </CardBody>
              </Card>
            </Box>

            {/* Generated Content Display */}
            <Box>
              <Card h="fit-content">
                <CardBody>
                  {isGenerating ? (
                    <LoadingSpinner text="Generating your content..." />
                  ) : !generatedContent ? (
                    <VStack spacing={6} py={20} textAlign="center">
                      <Box>
                        <Text fontSize="6xl" mb={4}>✨</Text>
                        <Heading size="md" color="gray.500" mb={2}>
                          생성된 콘텐츠가 여기에 표시됩니다
                        </Heading>
                        <Text color="gray.400">
                          왼쪽 폼을 작성하고 "생성하기" 버튼을 클릭해 AI 콘텐츠를 만들어보세요
                        </Text>
                      </Box>
                    </VStack>
                  ) : null}

                  {/* Content Display Section */}
                  {generatedContent && (
                    <VStack spacing={6} align="stretch">
                      <Box>
                        <HStack justify="space-between" mb={4}>
                          <Heading size="md" color="gray.800">생성된 콘텐츠</Heading>
                          <HStack spacing={2}>
                            <Badge colorScheme="blue">
                              {CONTENT_TYPE_LABELS[generatedContent.contentType as keyof typeof CONTENT_TYPE_LABELS]}
                            </Badge>
                            <Badge variant="outline">
                              {generatedContent.tone}
                            </Badge>
                          </HStack>
                        </HStack>
                        
                        <Box mb={4}>
                          <Text fontSize="sm" fontWeight="semibold" mb={2}>
                            주제: {generatedContent.topic}
                          </Text>
                          <HStack spacing={4} fontSize="sm" color="gray.600">
                            <Text>단어 수: {generatedContent.wordCount}개</Text>
                            <Text>읽는 시간: 약 {generatedContent.estimatedReadTime}분</Text>
                          </HStack>
                        </Box>
                      </Box>

                      <Divider />

                      <Box position="relative">
                        <Textarea
                          value={generatedContent.content}
                          readOnly
                          minH="300px"
                          resize="vertical"
                          bg="gray.50"
                          _focus={{ bg: 'gray.50' }}
                          pr="50px"
                        />
                        <Button
                          position="absolute"
                          top="8px"
                          right="8px"
                          size="sm"
                          variant="ghost"
                          colorScheme="blue"
                          onClick={handleCopyContent}
                          isLoading={isCopying}
                          leftIcon={<Copy size={14} />}
                        >
                          복사
                        </Button>
                      </Box>

                      <Divider />

                      {generatedContent.metadata && (
                        <Box fontSize="sm" color="gray.600">
                          {generatedContent.metadata.targetAudience && (
                            <Text>타겟 오디언스: {generatedContent.metadata.targetAudience}</Text>
                          )}
                          <Text>길이: {generatedContent.metadata.length}</Text>
                        </Box>
                      )}

                      {/* Evaluation Results Display */}
                      {evaluation && (
                        <Box p={4} bg="purple.50" borderRadius="md" border="1px solid" borderColor="purple.200">
                          <HStack justify="space-between" align="center" mb={3}>
                            <Heading size="sm" color="purple.700">
                              🤖 AI 평가 결과
                            </Heading>
                            <Badge colorScheme="purple" variant="solid" size="sm">
                              개선 가능
                            </Badge>
                          </HStack>
                          
                          <Flex align="center" mb={3}>
                            <Text fontSize="sm" fontWeight="semibold" color="purple.700" mr={2}>
                              종합 점수:
                            </Text>
                            <HStack spacing={1}>
                              {renderRatingStars(evaluation.rating)}
                              <Text fontSize="sm" fontWeight="bold" color="purple.700" ml={2}>
                                {evaluation.rating.toFixed(1)}/5
                              </Text>
                            </HStack>
                          </Flex>

                          {evaluation.feedback && (
                            <Box mb={3}>
                              <Text fontSize="sm" fontWeight="semibold" color="purple.700" mb={1}>
                                AI 피드백:
                              </Text>
                              <Text fontSize="sm" color="gray.700" bg="white" p={3} borderRadius="md" lineHeight="1.5">
                                {evaluation.feedback}
                              </Text>
                            </Box>
                          )}

                          {evaluation.criteria && (
                            <Box mb={3}>
                              <Text fontSize="sm" fontWeight="semibold" color="purple.700" mb={2}>
                                세부 평가:
                              </Text>
                              <VStack spacing={2} align="stretch">
                                {Object.entries(evaluation.criteria).map(([key, value]) => (
                                  <Flex key={key} align="center" fontSize="sm">
                                    <Text color="gray.600" minW="80px" mr={2}>
                                      {key === 'relevance' ? '관련성' :
                                       key === 'quality' ? '품질' :
                                       key === 'engagement' ? '참여도' :
                                       key === 'creativity' ? '창의성' :
                                       key === 'clarity' ? '명확성' :
                                       key === 'tone_accuracy' ? '톤 정확성' : key}:
                                    </Text>
                                    <Progress 
                                      value={(value as number) * 20} 
                                      size="sm" 
                                      colorScheme="purple" 
                                      flex={1} 
                                      mr={2}
                                      bg="white"
                                    />
                                    <Text color="purple.700" minW="30px" fontWeight="medium">
                                      {value}/5
                                    </Text>
                                  </Flex>
                                ))}
                              </VStack>
                            </Box>
                          )}

                          <Box p={3} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
                            <HStack spacing={2}>
                              <Text fontSize="xs" color="blue.600">💡</Text>
                              <Text fontSize="xs" color="blue.700" lineHeight="1.4">
                                <strong>"피드백 반영"</strong> 버튼을 클릭하면 위 피드백을 바탕으로 콘텐츠가 자동으로 개선됩니다.
                              </Text>
                            </HStack>
                          </Box>
                        </Box>
                      )}
                    </VStack>
                  )}

                  {/* Action Buttons - Always Visible */}
                  <VStack spacing={3} mt={6}>
                    {/* Save/Evaluate Button Split */}
                    <HStack spacing={2} width="100%">
                      <Button
                        colorScheme="brand"
                        size="lg"
                        flex={1}
                        onClick={handleSaveContent}
                        isLoading={isSaving}
                        loadingText="저장 중..."
                        isDisabled={!generatedContent}
                      >
                        콘텐츠 저장
                      </Button>
                      <Button
                        colorScheme="purple"
                        size="lg"
                        flex={1}
                        onClick={handleEvaluateContent}
                        isLoading={isEvaluating}
                        loadingText="평가 중..."
                        isDisabled={!generatedContent}
                      >
                        콘텐츠 평가
                      </Button>
                    </HStack>
                    
                    <HStack spacing={3} width="100%">
                      <Button
                        variant="outline"
                        size="md"
                        flex={1}
                        onClick={handleCopyContent}
                        isLoading={isCopying}
                        loadingText="복사 중..."
                        isDisabled={!generatedContent}
                        leftIcon={<Copy size={16} />}
                      >
                        콘텐츠 복사
                      </Button>
                      <Button
                        variant={evaluation ? "solid" : "outline"}
                        colorScheme={evaluation ? "green" : "gray"}
                        size="md"
                        flex={1}
                        onClick={evaluation ? handleImproveWithFeedback : () => {
                          setGeneratedContent(null)
                          setEvaluation(null)
                        }}
                        isLoading={isImprovingWithFeedback}
                        loadingText="AI가 개선 중..."
                        isDisabled={!generatedContent}
                        leftIcon={evaluation ? <TrendingUp size={16} /> : undefined}
                      >
                        {evaluation ? '🚀 피드백 반영' : '새로 생성'}
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </Box>
          </Grid>
        </VStack>
      </Layout>
    </ProtectedRoute>
  )
}