'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Textarea,
  Input,
  Select,
  useToast,
  IconButton,
  Tooltip,
  Badge,
  Card,
  CardBody,
  Divider,
  Flex,
  Spacer,
} from '@chakra-ui/react'
import { ArrowLeftIcon, CopyIcon, CheckIcon } from '@chakra-ui/icons'
import Layout from '@/components/layout/Layout'
import { Content } from '@/types'
import { createClientComponentClient } from '@/lib/supabase'
import { CONTENT_TYPE_LABELS } from '@/utils/constants'

export default function EditContentPage() {
  const router = useRouter()
  const params = useParams()
  const toast = useToast()
  // Mock data for testing
  const MOCK_CONTENTS: Content[] = [
    {
      id: '1',
      user_id: '00000000-0000-0000-0000-000000000001',
      title: 'AI의 미래와 마케팅',
      content: 'AI 기술이 마케팅 분야에 미치는 영향과 앞으로의 전망에 대해 알아보겠습니다. #AI #마케팅 #미래기술',
      content_type: 'x_post',
      tone: 'professional',
      status: 'published',
      topic: 'AI 마케팅',
      tags: ['AI', '마케팅', '기술'],
      word_count: 50,
      published_at: '2024-01-15T10:00:00Z',
      auto_generated: false,
      created_at: '2024-01-15T09:30:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    }
  ]

  const supabase = createClientComponentClient()

  const fetchContent = async (contentId: string): Promise<Content | null> => {
    try {
      console.log('🔍 Fetching single content:', contentId)
      
      // Mock 데이터에서 먼저 확인
      const mockContent = MOCK_CONTENTS.find(c => c.id === contentId)
      if (mockContent) {
        console.log('✅ Found in mock data:', mockContent.title)
        return mockContent
      }

      // Supabase에서 실제 콘텐츠 가져오기
      const { data, error } = await supabase
        .from('contents')
        .select('*')
        .eq('id', contentId)
        .single()

      if (error) {
        console.error('❌ Error fetching content from DB:', error)
        return null
      }

      console.log('✅ Found in database:', data.title || data.id)
      return data
    } catch (error) {
      console.error('❌ Error fetching content:', error)
      return null
    }
  }

  const updateContent = async (contentId: string, updates: Partial<Content>) => {
    try {
      console.log('📝 Updating content:', contentId, updates)
      
      // Mock 데이터는 로컬에서만 업데이트
      if (MOCK_CONTENTS.find(c => c.id === contentId)) {
        console.log('✅ Updated mock content locally')
        return { ...MOCK_CONTENTS[0], ...updates }
      }

      // 실제 DB 업데이트
      const { data: updatedContent, error } = await supabase
        .from('contents')
        .update({
          title: updates.title,
          content: updates.content,
          topic: updates.topic,
          tone: updates.tone,
          status: updates.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', contentId)
        .select()
        .single()

      if (error) {
        console.error('❌ Database update error:', error)
        throw new Error(error.message)
      }

      console.log('✅ Content updated in database:', updatedContent)
      return updatedContent
    } catch (error) {
      console.error('❌ Error updating content:', error)
      throw error
    }
  }
  
  const [content, setContent] = useState<Content | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    topic: '',
    tone: '',
    status: 'draft',
  })

  const loadContent = useCallback(async () => {
    if (!params.id) return
    
    setLoading(true)
    try {
      const data = await fetchContent(params.id as string)
      if (data) {
        setContent(data)
        setFormData({
          title: data.title || '',
          content: data.content || '',
          topic: data.topic || '',
          tone: data.tone || '',
          status: data.status || 'draft',
        })
      }
    } catch (error) {
      console.error('Failed to load content:', error)
      toast({
        title: '콘텐츠 로드 실패',
        description: '콘텐츠를 불러오는데 실패했습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }, [params.id]) // fetchContent와 toast 제거

  useEffect(() => {
    loadContent()
  }, [loadContent])

  const handleCopyContent = () => {
    if (formData.content) {
      navigator.clipboard.writeText(formData.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: '복사 완료',
        description: '콘텐츠가 클립보드에 복사되었습니다.',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    }
  }

  const handleSave = async () => {
    if (!content) return
    
    setSaving(true)
    try {
      await updateContent(content.id, formData)
      toast({
        title: '저장 완료',
        description: '콘텐츠가 성공적으로 저장되었습니다.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      router.push('/content/library')
    } catch (error) {
      console.error('Failed to save content:', error)
      toast({
        title: '저장 실패',
        description: '콘텐츠 저장에 실패했습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <Layout>
        <Container maxW="5xl" py={8}>
          <VStack spacing={4}>
            <Text>콘텐츠를 불러오는 중...</Text>
          </VStack>
        </Container>
      </Layout>
    )
  }

  if (!content) {
    return (
      <Layout>
        <Container maxW="5xl" py={8}>
          <VStack spacing={4}>
            <Text>콘텐츠를 찾을 수 없습니다.</Text>
            <Button onClick={() => router.push('/content/library')}>
              라이브러리로 돌아가기
            </Button>
          </VStack>
        </Container>
      </Layout>
    )
  }

  return (
    <Layout>
      <Container maxW="5xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Flex align="center">
            <HStack spacing={4}>
              <IconButton
                icon={<ArrowLeftIcon />}
                aria-label="뒤로가기"
                variant="ghost"
                onClick={() => router.push('/content/library')}
              />
              <VStack align="start" spacing={1}>
                <Heading size="lg">콘텐츠 편집</Heading>
                <HStack spacing={2}>
                  <Badge colorScheme="blue">
                    {CONTENT_TYPE_LABELS[content.content_type as keyof typeof CONTENT_TYPE_LABELS] || content.content_type}
                  </Badge>
                  <Badge colorScheme="green">
                    {content.tone}
                  </Badge>
                  <Text fontSize="sm" color="gray.500">
                    생성: {new Date(content.created_at).toLocaleDateString('ko-KR')}
                  </Text>
                </HStack>
              </VStack>
            </HStack>
            <Spacer />
            <HStack spacing={3}>
              <Tooltip label={copied ? '복사됨!' : '콘텐츠 복사'}>
                <Button
                  leftIcon={copied ? <CheckIcon /> : <CopyIcon />}
                  onClick={handleCopyContent}
                  variant="outline"
                  colorScheme={copied ? 'green' : 'gray'}
                >
                  {copied ? '복사됨' : '복사'}
                </Button>
              </Tooltip>
              <Button
                leftIcon={<CheckIcon />}
                colorScheme="brand"
                onClick={handleSave}
                isLoading={saving}
                loadingText="저장 중..."
              >
                저장
              </Button>
            </HStack>
          </Flex>

          <Divider />

          {/* Content Form */}
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {/* Title */}
                <Box>
                  <Text fontWeight="semibold" mb={2}>제목</Text>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="콘텐츠 제목을 입력하세요"
                    size="lg"
                  />
                </Box>

                {/* Topic */}
                <Box>
                  <Text fontWeight="semibold" mb={2}>주제</Text>
                  <Input
                    value={formData.topic}
                    onChange={(e) => handleChange('topic', e.target.value)}
                    placeholder="콘텐츠 주제"
                  />
                </Box>

                {/* Tone */}
                <Box>
                  <Text fontWeight="semibold" mb={2}>톤</Text>
                  <Select
                    value={formData.tone}
                    onChange={(e) => handleChange('tone', e.target.value)}
                  >
                    <option value="professional">전문적</option>
                    <option value="casual">캐주얼</option>
                    <option value="friendly">친근함</option>
                    <option value="formal">격식있는</option>
                    <option value="humorous">유머러스</option>
                  </Select>
                </Box>

                {/* Status */}
                <Box>
                  <Text fontWeight="semibold" mb={2}>상태</Text>
                  <Select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                  >
                    <option value="draft">임시저장</option>
                    <option value="published">발행됨</option>
                    <option value="scheduled">예약됨</option>
                    <option value="archived">보관됨</option>
                  </Select>
                </Box>

                {/* Content */}
                <Box>
                  <Flex mb={2} align="center">
                    <Text fontWeight="semibold">콘텐츠</Text>
                    <Spacer />
                    <Text fontSize="sm" color="gray.500">
                      {formData.content.length}자
                    </Text>
                  </Flex>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => handleChange('content', e.target.value)}
                    placeholder="콘텐츠 내용을 입력하세요"
                    rows={15}
                    resize="vertical"
                    fontSize="md"
                  />
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Actions */}
          <HStack justify="flex-end" spacing={3}>
            <Button
              variant="outline"
              onClick={() => router.push('/content/library')}
            >
              취소
            </Button>
            <Button
              leftIcon={<CheckIcon />}
              colorScheme="brand"
              onClick={handleSave}
              isLoading={saving}
              loadingText="저장 중..."
            >
              저장하기
            </Button>
          </HStack>
        </VStack>
      </Container>
    </Layout>
  )
}