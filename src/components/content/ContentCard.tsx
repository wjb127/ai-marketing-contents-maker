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
} from '@chakra-ui/react'
import { EditIcon, DeleteIcon, CalendarIcon, ViewIcon, MoreVertical, Copy } from 'lucide-react'
import { Content } from '@/types'

interface ContentCardProps {
  content: Content
  onEdit?: (content: Content) => void
  onDelete?: (contentId: string) => void
  onSchedule?: (content: Content) => void
  onView?: (content: Content) => void
  onCopy?: (content: Content) => void
}

export default function ContentCard({
  content,
  onEdit,
  onDelete,
  onSchedule,
  onView,
  onCopy,
}: ContentCardProps) {
  const toast = useToast()

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
      case 'copy':
        onCopy?.(content)
        break
    }
  }


  return (
    <Card 
      cursor="pointer"
      transition="all 0.2s"
      _hover={{ 
        transform: 'translateY(-2px)', 
        boxShadow: 'lg',
        borderColor: 'blue.200'
      }}
      onClick={() => onEdit?.(content)}
    >
      <CardHeader pb={2}>
        <HStack justify="space-between">
          <VStack align="start" spacing={1} flex={1}>
            <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }} noOfLines={1}>
              {content.title || 'AI 생성 콘텐츠'}
            </Text>
            <HStack spacing={1} flexWrap="wrap">
              <Badge colorScheme={getContentTypeColor(content.content_type || content.type)} size="sm" fontSize={{ base: "2xs", md: "xs" }}>
                {(content.content_type || content.type) ? (content.content_type || content.type).replace('_', ' ').toUpperCase() : 'UNKNOWN'}
              </Badge>
              <Badge colorScheme={getStatusColor(content.status)} size="sm" fontSize={{ base: "2xs", md: "xs" }}>
                {content.status ? content.status.toUpperCase() : 'UNKNOWN'}
              </Badge>
            </HStack>
          </VStack>
          
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<MoreVertical size={16} />}
              variant="ghost"
              size="sm"
              onClick={(e) => e.stopPropagation()}
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
              <MenuItem onClick={() => handleAction('copy')}>
                <Copy size={16} style={{ marginRight: '8px' }} />
                Copy Content
              </MenuItem>
              {content.status === 'draft' && (
                <MenuItem onClick={() => handleAction('schedule')}>
                  <CalendarIcon size={16} style={{ marginRight: '8px' }} />
                  Schedule
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
      
      <CardBody pt={0} px={{ base: 2, md: 4 }}>
        <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600" noOfLines={{ base: 2, md: 3 }} mb={{ base: 2, md: 3 }}>
          {content.content}
        </Text>
        
        <VStack align="start" spacing={1}>
          <Text fontSize={{ base: "2xs", md: "xs" }} color="gray.500">
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