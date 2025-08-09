'use client'

import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  useToast,
  Badge,
  FormHelperText,
  Grid,
} from '@chakra-ui/react'
import { useState } from 'react'
import { ContentType, ContentTone } from '@/types'
import { 
  CONTENT_TYPES, 
  CONTENT_TYPE_LABELS, 
  TONES, 
  TONE_LABELS, 
  CONTENT_LENGTHS,
  CONTENT_TYPE_SPECS,
  CREATIVITY_LEVELS 
} from '@/utils/constants'
import { getFieldsForContentType } from '@/utils/content-type-fields'

interface ContentFormProps {
  onSubmit?: (data: ContentFormData) => void
}

export interface ContentFormData {
  topic: string
  contentType: ContentType
  tone: ContentTone
  length: string
  additionalNotes: string
  includeHashtags: boolean
  creativityLevel?: string
  temperature?: number
  top_p?: number
}

export default function ContentForm({ onSubmit }: ContentFormProps) {
  const [formData, setFormData] = useState<ContentFormData>({
    topic: '',
    contentType: 'x_post',
    tone: 'professional',
    length: 'medium',
    additionalNotes: '',
    includeHashtags: true,
    creativityLevel: 'balanced',
  })
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.topic.trim()) {
      toast({
        title: '입력 오류',
        description: '콘텐츠 주제를 입력해주세요',
        status: 'error',
        duration: 3000,
      })
      return
    }

    setIsLoading(true)
    
    try {
      onSubmit?.(formData)
      toast({
        title: '콘텐츠 생성 시작',
        description: 'AI가 콘텐츠를 생성하고 있습니다...',
        status: 'info',
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: '오류',
        description: '콘텐츠 생성에 실패했습니다',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof ContentFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // 콘텐츠 타입 변경 시 추가 요청사항에 템플릿 자동 생성
  const handleContentTypeChange = (newContentType: ContentType) => {
    const fields = getFieldsForContentType(newContentType)
    
    // 타입별 전용 필드가 있으면 추가 요청사항에 템플릿 생성 (한국어 라벨 포함)
    let templateText = ''
    if (fields.length > 0) {
      templateText = fields.map(field => `${field.key} (${field.label}): ${field.placeholder}`).join('\n')
    }
    
    setFormData(prev => ({ 
      ...prev, 
      contentType: newContentType,
      additionalNotes: templateText // 기존 내용을 템플릿으로 교체
    }))
  }

  const selectedContentSpec = CONTENT_TYPE_SPECS[formData.contentType]

  return (
    <Card>
      <CardHeader>
        <Heading size="md" color="gray.800">새 콘텐츠 생성</Heading>
        <Text color="gray.600">다양한 플랫폼과 형식에 맞는 AI 콘텐츠를 만들어보세요</Text>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit}>
          <VStack spacing={6}>
            <FormControl isRequired>
              <FormLabel>주제</FormLabel>
              <Input
                placeholder="콘텐츠의 주제나 테마를 입력하세요"
                value={formData.topic}
                onChange={(e) => handleInputChange('topic', e.target.value)}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>콘텐츠 타입</FormLabel>
              <Select
                value={formData.contentType}
                onChange={(e) => handleContentTypeChange(e.target.value as ContentType)}
              >
                {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <FormHelperText>
                <HStack>
                  <Text fontSize="sm">{selectedContentSpec.description}</Text>
                  <Badge colorScheme="blue" size="sm">
                    최대: {selectedContentSpec.maxLength}자
                  </Badge>
                </HStack>
              </FormHelperText>
            </FormControl>

            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr 1fr' }} gap={4} width="100%">
              <FormControl>
                <FormLabel>톤 앤 매너</FormLabel>
                <Select
                  value={formData.tone}
                  onChange={(e) => handleInputChange('tone', e.target.value as ContentTone)}
                >
                  {Object.entries(TONE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>길이</FormLabel>
                <Select
                  value={formData.length}
                  onChange={(e) => handleInputChange('length', e.target.value)}
                >
                  <option value="short">짧게</option>
                  <option value="medium">보통</option>
                  <option value="long">길게</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>해시태그 포함</FormLabel>
                <Select
                  value={formData.includeHashtags ? 'yes' : 'no'}
                  onChange={(e) => handleInputChange('includeHashtags', e.target.value === 'yes')}
                >
                  <option value="yes">예</option>
                  <option value="no">아니오</option>
                </Select>
                <FormHelperText>
                  추천: {selectedContentSpec.recommendedHashtags}개 해시태그
                </FormHelperText>
              </FormControl>
            </Grid>

            <FormControl>
              <FormLabel>추가 요청사항 (선택사항)</FormLabel>
              <Textarea
                placeholder="타겟 오디언스, 특별한 요구사항, 스타일 선호도 등을 자유롭게 입력하세요...
예: 타겟 오디언스: 20-30대 직장인, 톤: 친근하고 공감대 형성, 길이: 3분 읽기 분량"
                value={formData.additionalNotes}
                onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                rows={6}
                resize="vertical"
                minH="150px"
              />
              <FormHelperText color="gray.500">
                💡 콘텐츠 타입별 전용 변수들이 자동으로 표시됩니다. 예시를 참고해서 실제 내용으로 수정해주세요.
              </FormHelperText>
            </FormControl>

            <FormControl>
              <FormLabel>🎨 창의성 레벨</FormLabel>
              <Select
                value={formData.creativityLevel}
                onChange={(e) => handleInputChange('creativityLevel', e.target.value)}
              >
                {Object.entries(CREATIVITY_LEVELS).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </Select>
              <FormHelperText>
                {CREATIVITY_LEVELS[formData.creativityLevel as keyof typeof CREATIVITY_LEVELS]?.description}
              </FormHelperText>
            </FormControl>

            <Button
              type="submit"
              colorScheme="brand"
              size="lg"
              width="100%"
              isLoading={isLoading}
              loadingText="콘텐츠 생성 중..."
            >
              {CONTENT_TYPE_LABELS[formData.contentType]} 생성하기
            </Button>
          </VStack>
        </form>
      </CardBody>
    </Card>
  )
}