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
} from '@chakra-ui/react'
import { useState } from 'react'
import Layout from '@/components/layout/Layout'
import ContentForm, { ContentFormData } from '@/components/content/ContentForm'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { CONTENT_TYPE_LABELS } from '@/utils/constants'
import { useContents } from '@/hooks/useContents'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

interface GeneratedContent {
  content: string
  contentType: string
  tone: string
  topic: string
  wordCount: number
  estimatedReadTime: number
  metadata: {
    targetAudience?: string
    includeHashtags?: boolean
    length?: string
  }
}

export default function CreateContentPage() {
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const { createContent } = useContents()
  const toast = useToast()

  const handleGenerateContent = async (data: ContentFormData) => {
    setIsGenerating(true)
    setGeneratedContent(null)

    try {
      const result = await createContent({
        type: data.contentType,
        tone: data.tone,
        topic: data.topic,
        target_audience: data.targetAudience,
        additional_instructions: data.additionalNotes
      })
      
      const formattedResult = {
        content: result.content,
        contentType: result.type,
        tone: result.tone,
        topic: result.topic,
        wordCount: result.content.split(/\s+/).length,
        estimatedReadTime: Math.ceil(result.content.split(/\s+/).length / 200),
        metadata: {
          targetAudience: result.target_audience,
          includeHashtags: true,
          length: 'medium'
        }
      }
      
      setGeneratedContent(formattedResult)
      
      toast({
        title: '콘텐츠 생성 완료!',
        description: 'AI가 생성한 콘텐츠가 성공적으로 저장되었습니다.',
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

  const handleSaveContent = () => {
    toast({
      title: '콘텐츠 저장 완료',
      description: '콘텐츠가 생성될 때 자동으로 저장되었습니다.',
      status: 'info',
      duration: 3000,
    })
  }

  const handleScheduleContent = () => {
    // Here you would open a scheduling modal or redirect to schedule page
    toast({
      title: '스케줄 기능 준비중',
      description: '콘텐츠 스케줄링 기능이 곧 출시됩니다!',
      status: 'info',
      duration: 3000,
    })
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
              <ContentForm onSubmit={handleGenerateContent} />
            </Box>

            {/* Generated Content Display */}
            <Box>
              <Card h="fit-content">
                <CardBody>
                  {isGenerating ? (
                    <LoadingSpinner text="Generating your content..." />
                  ) : generatedContent ? (
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

                      <Box>
                        <Textarea
                          value={generatedContent.content}
                          readOnly
                          minH="300px"
                          resize="vertical"
                          bg="gray.50"
                          _focus={{ bg: 'gray.50' }}
                        />
                      </Box>

                      <Divider />

                      <VStack spacing={3}>
                        <Button
                          colorScheme="brand"
                          size="lg"
                          width="100%"
                          onClick={handleSaveContent}
                        >
                          임시저장
                        </Button>
                        
                        <HStack spacing={3} width="100%">
                          <Button
                            variant="outline"
                            size="md"
                            flex={1}
                            onClick={handleScheduleContent}
                          >
                            스케줄 설정
                          </Button>
                          <Button
                            variant="outline"
                            size="md"
                            flex={1}
                            onClick={() => setGeneratedContent(null)}
                          >
                            새로 생성
                          </Button>
                        </HStack>
                      </VStack>

                      {generatedContent.metadata && (
                        <Box pt={4} fontSize="sm" color="gray.600">
                          {generatedContent.metadata.targetAudience && (
                            <Text>타겟 오디언스: {generatedContent.metadata.targetAudience}</Text>
                          )}
                          {generatedContent.metadata.includeHashtags && (
                            <Text>해시태그: 포함됨</Text>
                          )}
                          <Text>길이: {generatedContent.metadata.length}</Text>
                        </Box>
                      )}
                    </VStack>
                  ) : (
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
                  )}
                </CardBody>
              </Card>
            </Box>
          </Grid>
        </VStack>
      </Layout>
    </ProtectedRoute>
  )
}