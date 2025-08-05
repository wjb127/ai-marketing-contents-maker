'use client'

import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Text,
  Badge,
  HStack,
  VStack,
  Button,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  Tooltip,
  CircularProgress,
  CircularProgressLabel,
  Progress,
  Flex,
  Spacer,
} from '@chakra-ui/react'
import { EditIcon, DeleteIcon, CalendarIcon, ViewIcon, MoreVertical, Star, TrendingUp } from 'lucide-react'
import { Content } from '@/types'
import { useState } from 'react'

interface ContentCardProps {
  content: Content
  onEdit?: (content: Content) => void
  onDelete?: (contentId: string) => void
  onSchedule?: (content: Content) => void
  onView?: (content: Content) => void
  onEvaluate?: (contentId: string) => void
}

export default function ContentCard({
  content,
  onEdit,
  onDelete,
  onSchedule,
  onView,
  onEvaluate,
}: ContentCardProps) {
  const toast = useToast()
  const [isEvaluating, setIsEvaluating] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'green'
      case 'scheduled':
        return 'blue'
      case 'draft':
        return 'yellow'
      default:
        return 'gray'
    }
  }

  const getContentTypeColor = (contentType: string) => {
    switch (contentType) {
      case 'x_post':
      case 'thread':
        return 'blue'
      case 'instagram_reel_script':
        return 'pink'
      case 'linkedin_post':
        return 'blue'
      case 'facebook_post':
        return 'blue'
      case 'blog_post':
        return 'purple'
      case 'youtube_script':
        return 'red'
      default:
        return 'gray'
    }
  }

  const handleAction = (action: string) => {
    switch (action) {
      case 'edit':
        onEdit?.(content)
        break
      case 'delete':
        onDelete?.(content.id)
        break
      case 'schedule':
        onSchedule?.(content)
        break
      case 'view':
        onView?.(content)
        break
      case 'evaluate':
        handleEvaluate()
        break
    }
  }

  const handleEvaluate = async () => {
    if (isEvaluating) return
    
    setIsEvaluating(true)
    try {
      await onEvaluate?.(content.id)
      toast({
        title: '평가 완료',
        description: 'AI 평가가 성공적으로 완료되었습니다.',
        status: 'success',
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: '평가 실패',
        description: 'AI 평가에 실패했습니다. 다시 시도해주세요.',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setIsEvaluating(false)
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
            size={12}
            fill="gold"
            color="gold"
          />
        )
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star
            key={i}
            size={12}
            fill="url(#halfGrad)"
            color="gold"
          />
        )
      } else {
        stars.push(
          <Star
            key={i}
            size={12}
            color="gray"
          />
        )
      }
    }

    return stars
  }

  return (
    <Card>
      <CardHeader pb={2}>
        <HStack justify="space-between">
          <VStack align="start" spacing={1}>
            <Text fontWeight="bold" fontSize="md" noOfLines={1}>
              {content.title}
            </Text>
            <HStack spacing={2}>
              <Badge colorScheme={getContentTypeColor(content.content_type)} size="sm">
                {content.content_type.replace('_', ' ').toUpperCase()}
              </Badge>
              <Badge colorScheme={getStatusColor(content.status)} size="sm">
                {content.status.toUpperCase()}
              </Badge>
            </HStack>
          </VStack>
          
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<MoreVertical size={16} />}
              variant="ghost"
              size="sm"
            />
            <MenuList>
              <MenuItem onClick={() => handleAction('view')}>
                <ViewIcon size={16} style={{ marginRight: '8px' }} />
                View
              </MenuItem>
              <MenuItem onClick={() => handleAction('edit')}>
                <EditIcon size={16} style={{ marginRight: '8px' }} />
                Edit
              </MenuItem>
              {content.status === 'draft' && (
                <MenuItem onClick={() => handleAction('schedule')}>
                  <CalendarIcon size={16} style={{ marginRight: '8px' }} />
                  Schedule
                </MenuItem>
              )}
              {!content.ai_rating && (
                <MenuItem onClick={() => handleAction('evaluate')} isDisabled={isEvaluating}>
                  <TrendingUp size={16} style={{ marginRight: '8px' }} />
                  {isEvaluating ? 'AI 평가 중...' : 'AI 평가'}
                </MenuItem>
              )}
              <MenuItem onClick={() => handleAction('delete')} color="red.500">
                <DeleteIcon size={16} style={{ marginRight: '8px' }} />
                Delete
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </CardHeader>
      
      <CardBody pt={0}>
        <Text fontSize="sm" color="gray.600" noOfLines={3} mb={3}>
          {content.content}
        </Text>
        
        {/* AI 평가 정보 */}
        {content.ai_rating && (
          <Box mb={3} p={3} bg="gray.50" borderRadius="md">
            <Flex align="center" mb={2}>
              <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                AI 평가
              </Text>
              <Spacer />
              <HStack spacing={1}>
                {renderRatingStars(content.ai_rating)}
                <Text fontSize="sm" fontWeight="bold" color="gray.700" ml={1}>
                  {content.ai_rating.toFixed(1)}
                </Text>
              </HStack>
            </Flex>
            
            {content.ai_feedback && (
              <Text fontSize="xs" color="gray.600" noOfLines={2}>
                {content.ai_feedback}
              </Text>
            )}
            
            {content.ai_evaluation_criteria && (
              <VStack spacing={1} mt={2} align="stretch">
                {Object.entries(content.ai_evaluation_criteria).map(([key, value]) => (
                  <Flex key={key} align="center" fontSize="xs">
                    <Text color="gray.500" minW="60px">
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
                      colorScheme="blue" 
                      flex={1} 
                      mx={2}
                    />
                    <Text color="gray.600" minW="20px">
                      {value}/5
                    </Text>
                  </Flex>
                ))}
              </VStack>
            )}
            
            {content.evaluated_at && (
              <Text fontSize="xs" color="gray.400" mt={2}>
                평가 일시: {new Date(content.evaluated_at).toLocaleDateString()}
              </Text>
            )}
          </Box>
        )}
        
        <VStack align="start" spacing={1}>
          <Text fontSize="xs" color="gray.500">
            Created: {new Date(content.created_at).toLocaleDateString()}
          </Text>
          {content.scheduled_at && (
            <Text fontSize="xs" color="blue.500">
              Scheduled: {new Date(content.scheduled_at).toLocaleDateString()}
            </Text>
          )}
          {content.published_at && (
            <Text fontSize="xs" color="green.500">
              Published: {new Date(content.published_at).toLocaleDateString()}
            </Text>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}