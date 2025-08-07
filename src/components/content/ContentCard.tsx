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
      
      <CardBody pt={0}>
        <Text fontSize="sm" color="gray.600" noOfLines={3} mb={3}>
          {content.content}
        </Text>
        
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