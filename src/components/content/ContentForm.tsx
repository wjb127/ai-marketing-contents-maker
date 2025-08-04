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
  CONTENT_TYPE_SPECS 
} from '@/utils/constants'

interface ContentFormProps {
  onSubmit?: (data: ContentFormData) => void
}

export interface ContentFormData {
  topic: string
  contentType: ContentType
  tone: ContentTone
  length: string
  additionalNotes: string
  targetAudience: string
  includeHashtags: boolean
}

export default function ContentForm({ onSubmit }: ContentFormProps) {
  const [formData, setFormData] = useState<ContentFormData>({
    topic: '',
    contentType: 'x_post',
    tone: 'professional',
    length: 'medium',
    additionalNotes: '',
    targetAudience: '',
    includeHashtags: true,
  })
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.topic.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a topic for your content',
        status: 'error',
        duration: 3000,
      })
      return
    }

    setIsLoading(true)
    
    try {
      onSubmit?.(formData)
      toast({
        title: 'Content Generation Started',
        description: 'Your AI content is being generated...',
        status: 'info',
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate content',
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

  const selectedContentSpec = CONTENT_TYPE_SPECS[formData.contentType]

  return (
    <Card>
      <CardHeader>
        <Heading size="md">Generate New Content</Heading>
        <Text color="gray.600">Create AI-powered content for various platforms and formats</Text>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit}>
          <VStack spacing={6}>
            <FormControl isRequired>
              <FormLabel>Topic</FormLabel>
              <Input
                placeholder="Enter the topic or theme for your content"
                value={formData.topic}
                onChange={(e) => handleInputChange('topic', e.target.value)}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Content Type</FormLabel>
              <Select
                value={formData.contentType}
                onChange={(e) => handleInputChange('contentType', e.target.value as ContentType)}
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
                    Max: {selectedContentSpec.maxLength} chars
                  </Badge>
                </HStack>
              </FormHelperText>
            </FormControl>

            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr 1fr' }} gap={4} width="100%">
              <FormControl>
                <FormLabel>Tone</FormLabel>
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
                <FormLabel>Length</FormLabel>
                <Select
                  value={formData.length}
                  onChange={(e) => handleInputChange('length', e.target.value)}
                >
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Include Hashtags</FormLabel>
                <Select
                  value={formData.includeHashtags ? 'yes' : 'no'}
                  onChange={(e) => handleInputChange('includeHashtags', e.target.value === 'yes')}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </Select>
                <FormHelperText>
                  Recommended: {selectedContentSpec.recommendedHashtags} hashtags
                </FormHelperText>
              </FormControl>
            </Grid>

            <FormControl>
              <FormLabel>Target Audience (Optional)</FormLabel>
              <Input
                placeholder="e.g., Entrepreneurs, Students, Tech enthusiasts..."
                value={formData.targetAudience}
                onChange={(e) => handleInputChange('targetAudience', e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Additional Notes (Optional)</FormLabel>
              <Textarea
                placeholder="Any specific requirements, style preferences, or additional context..."
                value={formData.additionalNotes}
                onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                rows={3}
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="brand"
              size="lg"
              width="100%"
              isLoading={isLoading}
              loadingText="Generating Content..."
            >
              Generate {CONTENT_TYPE_LABELS[formData.contentType]}
            </Button>
          </VStack>
        </form>
      </CardBody>
    </Card>
  )
}