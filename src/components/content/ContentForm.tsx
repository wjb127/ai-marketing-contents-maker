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

  // 콘텐츠 클리셰 변경 시 추가 요청사항에 템플릿 자동 생성
  const handleContentTypeChange = (newContentType: ContentType) => {
    const fields = getFieldsForContentType(newContentType)
    
    // 클리셰별 전용 필드가 있으면 추가 요청사항에 템플릿 생성 (한국어 라벨 포함)
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

            {/* 클리셰 선택 영역 */}
            <Box
              position="relative"
              p={6}
              borderRadius="xl"
              bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              color="white"
              boxShadow="xl"
              _before={{
                content: '""',
                position: "absolute",
                top: -2,
                left: -2,
                right: -2,
                bottom: -2,
                background: "linear-gradient(135deg, #667eea, #764ba2, #f093fb, #f5576c)",
                borderRadius: "xl",
                zIndex: -1,
                filter: "blur(8px)",
                opacity: 0.7,
              }}
              animation="pulse 3s infinite"
              sx={{
                "@keyframes pulse": {
                  "0%, 100%": { transform: "scale(1)" },
                  "50%": { transform: "scale(1.02)" }
                }
              }}
            >
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between" align="center">
                  <HStack spacing={2}>
                    <Box
                      fontSize="xl"
                      animation="sparkle 2s infinite"
                      sx={{
                        "@keyframes sparkle": {
                          "0%, 100%": { transform: "rotate(0deg) scale(1)" },
                          "25%": { transform: "rotate(-10deg) scale(1.1)" },
                          "75%": { transform: "rotate(10deg) scale(1.1)" }
                        }
                      }}
                    >
                      ✨
                    </Box>
                    <FormLabel color="white" mb={0} fontSize="lg" fontWeight="bold">
                      콘텐츠 클리셰 
                    </FormLabel>
                  </HStack>
                  <Badge 
                    colorScheme="yellow" 
                    variant="solid" 
                    px={3} 
                    py={1}
                    borderRadius="full"
                    fontSize="xs"
                    fontWeight="bold"
                    textTransform="uppercase"
                    animation="glow 2s infinite alternate"
                    sx={{
                      "@keyframes glow": {
                        "0%": { boxShadow: "0 0 5px rgba(255, 215, 0, 0.5)" },
                        "100%": { boxShadow: "0 0 20px rgba(255, 215, 0, 0.8)" }
                      }
                    }}
                  >
                    🏆
                  </Badge>
                </HStack>
                
                <Text fontSize="sm" color="whiteAlpha.900" lineHeight="1.5">
                  검증된 SNS 성공 패턴으로 즉시 통하는 콘텐츠를 생성하세요
                </Text>
                
                <FormControl isRequired>
                  <Select
                    value={formData.contentType}
                    onChange={(e) => handleContentTypeChange(e.target.value as ContentType)}
                    bg="white"
                    color="gray.800"
                    border="none"
                    borderRadius="lg"
                    fontSize="md"
                    fontWeight="semibold"
                    _focus={{
                      bg: "white",
                      boxShadow: "0 0 0 3px rgba(255, 255, 255, 0.3)"
                    }}
                    _hover={{
                      bg: "gray.50"
                    }}
                    size="lg"
                  >
                    {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value} style={{ color: '#2D3748' }}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                
                <HStack spacing={3} justify="space-between" flexWrap="wrap">
                  <VStack spacing={1} align="start">
                    <Text fontSize="xs" color="whiteAlpha.700" fontWeight="semibold">
                      최적화된 길이
                    </Text>
                    <Badge colorScheme="whiteAlpha" variant="solid" size="sm">
                      최대 {selectedContentSpec.maxLength}자
                    </Badge>
                  </VStack>
                  <VStack spacing={1} align="end">
                    <Text fontSize="xs" color="whiteAlpha.700" fontWeight="semibold">
                      추천 해시태그
                    </Text>
                    <Badge colorScheme="whiteAlpha" variant="solid" size="sm">
                      {selectedContentSpec.recommendedHashtags}개
                    </Badge>
                  </VStack>
                </HStack>
                
                <Text fontSize="xs" color="whiteAlpha.800" fontStyle="italic">
                  💡 {selectedContentSpec.description}
                </Text>
              </VStack>
            </Box>

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
                💡 콘텐츠 클리셰별 전용 변수들이 자동으로 표시됩니다. 예시를 참고해서 실제 내용으로 수정해주세요.
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