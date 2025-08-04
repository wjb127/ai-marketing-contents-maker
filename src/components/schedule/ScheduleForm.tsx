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
  Switch,
  FormHelperText,
  Badge,
  Wrap,
  WrapItem,
  Divider,
} from '@chakra-ui/react'
import { useState } from 'react'
import { ContentType, ContentTone } from '@/types'
import { 
  CONTENT_TYPES, 
  CONTENT_TYPE_LABELS, 
  TONES, 
  TONE_LABELS, 
  SCHEDULE_FREQUENCY,
  FREQUENCY_LABELS,
  PLAN_LIMITS,
  SUBSCRIPTION_PLANS
} from '@/utils/constants'
import { useAuth } from '@/hooks/useAuth'

interface ScheduleFormProps {
  onSubmit?: (data: ScheduleFormData) => void
}

export interface ScheduleFormData {
  name: string
  contentType: ContentType
  frequency: string
  time: string
  timezone: string
  topics: string[]
  tone: ContentTone
  targetAudience: string
  autoPublish: boolean
  includeHashtags: boolean
  contentLength: string
  maxPerDay: number
}

export default function ScheduleForm({ onSubmit }: ScheduleFormProps) {
  const { user } = useAuth()
  const userPlan = user?.user_metadata?.subscription_plan || 'free'
  const planLimits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS]
  
  const [formData, setFormData] = useState<ScheduleFormData>({
    name: '',
    contentType: 'x_post',
    frequency: 'daily',
    time: '09:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    topics: [],
    tone: 'professional',
    targetAudience: '',
    autoPublish: false,
    includeHashtags: true,
    contentLength: 'medium',
    maxPerDay: 1,
  })
  
  const [topicInput, setTopicInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a schedule name',
        status: 'error',
        duration: 3000,
      })
      return
    }

    if (formData.topics.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one topic',
        status: 'error',
        duration: 3000,
      })
      return
    }

    // Check if content type is allowed for user plan
    if (!planLimits.contentTypes.includes(formData.contentType)) {
      toast({
        title: 'Upgrade Required',
        description: `${CONTENT_TYPE_LABELS[formData.contentType]} is only available for Pro and Premium users`,
        status: 'warning',
        duration: 5000,
      })
      return
    }

    // Check auto generation permission
    if (formData.autoPublish && !planLimits.autoGeneration) {
      toast({
        title: 'Upgrade Required',
        description: 'Auto-generation is only available for Pro and Premium users',
        status: 'warning',
        duration: 5000,
      })
      return
    }

    setIsLoading(true)
    
    try {
      onSubmit?.(formData)
      toast({
        title: 'Schedule Created',
        description: 'Your content schedule has been created successfully!',
        status: 'success',
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create schedule',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof ScheduleFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addTopic = () => {
    if (topicInput.trim() && !formData.topics.includes(topicInput.trim())) {
      setFormData(prev => ({
        ...prev,
        topics: [...prev.topics, topicInput.trim()]
      }))
      setTopicInput('')
    }
  }

  const removeTopic = (topicToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.filter(topic => topic !== topicToRemove)
    }))
  }

  const isContentTypeAllowed = planLimits.contentTypes.includes(formData.contentType)

  return (
    <Card>
      <CardHeader>
        <Heading size="md">Create Auto-Generation Schedule</Heading>
        <Text color="gray.600">Set up automated content generation for consistent posting</Text>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit}>
          <VStack spacing={6}>
            <FormControl isRequired>
              <FormLabel>Schedule Name</FormLabel>
              <Input
                placeholder="e.g., Daily Tech Tips, Weekly Motivation..."
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Content Type</FormLabel>
              <Select
                value={formData.contentType}
                onChange={(e) => handleInputChange('contentType', e.target.value as ContentType)}
              >
                {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => {
                  const isAllowed = planLimits.contentTypes.includes(value as ContentType)
                  return (
                    <option key={value} value={value} disabled={!isAllowed}>
                      {label} {!isAllowed ? '(Pro/Premium)' : ''}
                    </option>
                  )
                })}
              </Select>
              {!isContentTypeAllowed && (
                <FormHelperText color="orange.500">
                  This content type requires a Pro or Premium plan
                </FormHelperText>
              )}
            </FormControl>

            <HStack spacing={4} width="100%" align="start">
              <FormControl>
                <FormLabel>Frequency</FormLabel>
                <Select
                  value={formData.frequency}
                  onChange={(e) => handleInputChange('frequency', e.target.value)}
                >
                  {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Time</FormLabel>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Max per Day</FormLabel>
                <Select
                  value={formData.maxPerDay}
                  onChange={(e) => handleInputChange('maxPerDay', parseInt(e.target.value))}
                >
                  <option value={1}>1 post</option>
                  <option value={2}>2 posts</option>
                  <option value={3}>3 posts</option>
                  <option value={5}>5 posts</option>
                </Select>
              </FormControl>
            </HStack>

            <FormControl isRequired>
              <FormLabel>Topics</FormLabel>
              <HStack>
                <Input
                  placeholder="Enter a topic and press Add"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                />
                <Button onClick={addTopic} variant="outline">
                  Add
                </Button>
              </HStack>
              
              {formData.topics.length > 0 && (
                <Box mt={3}>
                  <Wrap>
                    {formData.topics.map((topic, index) => (
                      <WrapItem key={index}>
                        <Badge
                          variant="solid"
                          colorScheme="brand"
                          cursor="pointer"
                          onClick={() => removeTopic(topic)}
                          _hover={{ opacity: 0.8 }}
                        >
                          {topic} ✕
                        </Badge>
                      </WrapItem>
                    ))}
                  </Wrap>
                </Box>
              )}
            </FormControl>

            <HStack spacing={4} width="100%">
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
                <FormLabel>Content Length</FormLabel>
                <Select
                  value={formData.contentLength}
                  onChange={(e) => handleInputChange('contentLength', e.target.value)}
                >
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </Select>
              </FormControl>
            </HStack>

            <FormControl>
              <FormLabel>Target Audience (Optional)</FormLabel>
              <Input
                placeholder="e.g., Entrepreneurs, Students, Tech enthusiasts..."
                value={formData.targetAudience}
                onChange={(e) => handleInputChange('targetAudience', e.target.value)}
              />
            </FormControl>

            <Divider />

            <VStack spacing={4} width="100%">
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Include Hashtags</FormLabel>
                <Switch
                  isChecked={formData.includeHashtags}
                  onChange={(e) => handleInputChange('includeHashtags', e.target.checked)}
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Auto Publish</FormLabel>
                <Switch
                  isChecked={formData.autoPublish}
                  onChange={(e) => handleInputChange('autoPublish', e.target.checked)}
                  isDisabled={!planLimits.autoGeneration}
                />
                {!planLimits.autoGeneration && (
                  <Text fontSize="sm" color="gray.500" ml={3}>
                    Pro/Premium feature
                  </Text>
                )}
              </FormControl>
              
              <FormHelperText>
                Auto publish will automatically post generated content. 
                If disabled, content will be saved as drafts for manual review.
              </FormHelperText>
            </VStack>

            <Button
              type="submit"
              colorScheme="brand"
              size="lg"
              width="100%"
              isLoading={isLoading}
              loadingText="Creating Schedule..."
              isDisabled={!isContentTypeAllowed}
            >
              Create Schedule
            </Button>
          </VStack>
        </form>
      </CardBody>
    </Card>
  )
}