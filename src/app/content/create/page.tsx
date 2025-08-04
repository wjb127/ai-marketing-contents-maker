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
        title: 'Content Generated!',
        description: 'Your AI-powered content has been created and saved.',
        status: 'success',
        duration: 3000,
      })
    } catch (error: any) {
      toast({
        title: 'Generation Failed',
        description: error.message || 'There was an error generating your content. Please try again.',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveContent = () => {
    toast({
      title: 'Content Already Saved',
      description: 'Your content was saved automatically when generated.',
      status: 'info',
      duration: 3000,
    })
  }

  const handleScheduleContent = () => {
    // Here you would open a scheduling modal or redirect to schedule page
    toast({
      title: 'Feature Coming Soon',
      description: 'Content scheduling will be available soon!',
      status: 'info',
      duration: 3000,
    })
  }

  return (
    <ProtectedRoute>
      <Layout>
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading size="xl" mb={2}>
              Create Content
            </Heading>
            <Text color="gray.600" fontSize="lg">
              Generate AI-powered content for your social media platforms
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
                          <Heading size="md">Generated Content</Heading>
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
                            Topic: {generatedContent.topic}
                          </Text>
                          <HStack spacing={4} fontSize="sm" color="gray.600">
                            <Text>Words: {generatedContent.wordCount}</Text>
                            <Text>Read time: ~{generatedContent.estimatedReadTime} min</Text>
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
                          Save as Draft
                        </Button>
                        
                        <HStack spacing={3} width="100%">
                          <Button
                            variant="outline"
                            size="md"
                            flex={1}
                            onClick={handleScheduleContent}
                          >
                            Schedule Post
                          </Button>
                          <Button
                            variant="outline"
                            size="md"
                            flex={1}
                            onClick={() => setGeneratedContent(null)}
                          >
                            Generate New
                          </Button>
                        </HStack>
                      </VStack>

                      {generatedContent.metadata && (
                        <Box pt={4} fontSize="sm" color="gray.600">
                          {generatedContent.metadata.targetAudience && (
                            <Text>Target Audience: {generatedContent.metadata.targetAudience}</Text>
                          )}
                          {generatedContent.metadata.includeHashtags && (
                            <Text>Hashtags: Included</Text>
                          )}
                          <Text>Length: {generatedContent.metadata.length}</Text>
                        </Box>
                      )}
                    </VStack>
                  ) : (
                    <VStack spacing={6} py={20} textAlign="center">
                      <Box>
                        <Heading size="md" color="gray.500" mb={2}>
                          Your content will appear here
                        </Heading>
                        <Text color="gray.400">
                          Fill out the form on the left and click "Generate" to create AI-powered content
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