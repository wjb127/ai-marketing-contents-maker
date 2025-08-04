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
  Switch,
  Wrap,
  WrapItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react'
import { EditIcon, DeleteIcon, PlayIcon, PauseIcon } from '@chakra-ui/icons'
import { MoreVertical } from 'lucide-react'
import { Schedule } from '@/types'
import { CONTENT_TYPE_LABELS, TONE_LABELS, FREQUENCY_LABELS } from '@/utils/constants'

interface ScheduleCardProps {
  schedule: Schedule
  onEdit?: (schedule: Schedule) => void
  onDelete?: (scheduleId: string) => void
  onToggleActive?: (scheduleId: string, isActive: boolean) => void
}

export default function ScheduleCard({
  schedule,
  onEdit,
  onDelete,
  onToggleActive,
}: ScheduleCardProps) {
  const toast = useToast()

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'green' : 'gray'
  }

  const getContentTypeColor = (contentType: string) => {
    switch (contentType) {
      case 'thread':
        return 'blue'
      case 'x_post':
        return 'twitter'
      case 'blog_post':
        return 'purple'
      case 'youtube_script':
        return 'red'
      case 'instagram_reel_script':
        return 'pink'
      case 'linkedin_post':
        return 'linkedin'
      case 'facebook_post':
        return 'facebook'
      default:
        return 'gray'
    }
  }

  const handleToggleActive = async () => {
    try {
      onToggleActive?.(schedule.id, !schedule.is_active)
      toast({
        title: schedule.is_active ? 'Schedule Paused' : 'Schedule Activated',
        description: `Schedule "${schedule.name}" has been ${schedule.is_active ? 'paused' : 'activated'}`,
        status: 'success',
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update schedule',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleAction = (action: string) => {
    switch (action) {
      case 'edit':
        onEdit?.(schedule)
        break
      case 'delete':
        onDelete?.(schedule.id)
        break
    }
  }

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const formatNextRun = (nextRun?: string) => {
    if (!nextRun) return 'Not scheduled'
    const date = new Date(nextRun)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays < 7) return `In ${diffDays} days`
    
    return date.toLocaleDateString()
  }

  return (
    <Card>
      <CardHeader pb={2}>
        <HStack justify="space-between">
          <VStack align="start" spacing={1}>
            <HStack>
              <Text fontWeight="bold" fontSize="md">
                {schedule.name}
              </Text>
              <Badge colorScheme={getStatusColor(schedule.is_active)} size="sm">
                {schedule.is_active ? 'Active' : 'Paused'}
              </Badge>
            </HStack>
            <HStack spacing={2}>
              <Badge colorScheme={getContentTypeColor(schedule.content_type)} size="sm">
                {CONTENT_TYPE_LABELS[schedule.content_type]}
              </Badge>
              <Badge variant="outline" size="sm">
                {FREQUENCY_LABELS[schedule.frequency as keyof typeof FREQUENCY_LABELS]}
              </Badge>
              <Badge variant="outline" size="sm">
                {formatTime(schedule.time)}
              </Badge>
            </HStack>
          </VStack>
          
          <HStack>
            <Switch
              isChecked={schedule.is_active}
              onChange={handleToggleActive}
              size="sm"
            />
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<MoreVertical size={16} />}
                variant="ghost"
                size="sm"
              />
              <MenuList>
                <MenuItem onClick={() => handleAction('edit')}>
                  <EditIcon mr={2} />
                  Edit
                </MenuItem>
                <MenuItem onClick={() => handleAction('delete')} color="red.500">
                  <DeleteIcon mr={2} />
                  Delete
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </HStack>
      </CardHeader>
      
      <CardBody pt={0}>
        <VStack spacing={4} align="stretch">
          <Box>
            <Text fontSize="sm" fontWeight="semibold" mb={2}>
              Topics:
            </Text>
            <Wrap>
              {schedule.topics.map((topic, index) => (
                <WrapItem key={index}>
                  <Badge variant="subtle" colorScheme="blue">
                    {topic}
                  </Badge>
                </WrapItem>
              ))}
            </Wrap>
          </Box>

          <HStack spacing={6}>
            <Stat size="sm">
              <StatLabel>Generated</StatLabel>
              <StatNumber fontSize="lg">{schedule.total_generated}</StatNumber>
              <StatHelpText>Total posts</StatHelpText>
            </Stat>
            
            <Stat size="sm">
              <StatLabel>Next Run</StatLabel>
              <StatNumber fontSize="sm">{formatNextRun(schedule.next_run_at)}</StatNumber>
              <StatHelpText>
                {schedule.is_active ? 'Scheduled' : 'Paused'}
              </StatHelpText>
            </Stat>
          </HStack>

          <Box>
            <Text fontSize="xs" color="gray.500">
              Tone: {TONE_LABELS[schedule.tone]} • 
              Auto Publish: {schedule.settings.auto_publish ? 'Yes' : 'No'} • 
              Max per day: {schedule.settings.max_per_day || 1}
            </Text>
            {schedule.settings.target_audience && (
              <Text fontSize="xs" color="gray.500">
                Audience: {schedule.settings.target_audience}
              </Text>
            )}
          </Box>
        </VStack>
      </CardBody>
    </Card>
  )
}