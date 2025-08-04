'use client'

import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  SimpleGrid,
  Alert,
  AlertIcon,
  Spinner,
  Center,
  useToast,
} from '@chakra-ui/react'
import { AddIcon } from '@chakra-ui/icons'
import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import ScheduleForm, { ScheduleFormData } from '@/components/schedule/ScheduleForm'
import ScheduleCard from '@/components/schedule/ScheduleCard'
import SubscriptionManager from '@/components/subscription/SubscriptionManager'
import { Schedule } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { useUser } from '@/hooks/useUser'
import { useSchedules } from '@/hooks/useSchedules'
import { PLAN_LIMITS, SUBSCRIPTION_PLANS } from '@/utils/constants'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function SchedulePage() {
  const { user: authUser } = useAuth()
  const { user } = useUser()
  const { schedules, loading, error, createSchedule, toggleSchedule, deleteSchedule } = useSchedules()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { 
    isOpen: isUpgradeOpen, 
    onOpen: onUpgradeOpen, 
    onClose: onUpgradeClose 
  } = useDisclosure()
  const toast = useToast()

  const userPlan = user?.subscription_plan || 'free'
  const planLimits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS]


  const handleCreateSchedule = async (data: ScheduleFormData) => {
    // Check schedule limits
    if (planLimits.maxSchedules !== -1 && schedules.length >= planLimits.maxSchedules) {
      onUpgradeOpen()
      return
    }

    try {
      await createSchedule({
        name: data.name,
        content_type: data.contentType,
        content_tone: data.tone,
        topic: data.topics.join(', '),
        target_audience: data.targetAudience,
        additional_instructions: `Auto-publish: ${data.autoPublish}, Max per day: ${data.maxPerDay}`,
        frequency: data.frequency,
        time_of_day: data.time,
        timezone: data.timezone
      })
      onClose()
    } catch (error) {
      console.error('Failed to create schedule:', error)
    }
  }

  const handleToggleActive = async (scheduleId: string, isActive: boolean) => {
    try {
      await toggleSchedule(scheduleId, isActive)
    } catch (error) {
      console.error('Failed to toggle schedule:', error)
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await deleteSchedule(scheduleId)
    } catch (error) {
      console.error('Failed to delete schedule:', error)
    }
  }

  const canCreateSchedule = planLimits.maxSchedules === -1 || schedules.length < planLimits.maxSchedules

  // QStash 테스트 함수
  const handleTestQStash = async () => {
    try {
      const response = await fetch('/api/schedule/test', {
        method: 'POST'
      })
      
      const result = await response.json()
      
      if (response.ok) {
        toast({
          title: 'QStash 테스트 성공!',
          description: '✨ 1분 후에 콘텐츠가 자동 생성됩니다. 콘텐츠 라이브러리에서 확인하세요.',
          status: 'success',
          duration: 8000,
          isClosable: true,
        })
        
        // 스케줄 목록 새로고침
        window.location.reload()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: 'QStash 테스트 실패',
        description: `오류: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  return (
    <ProtectedRoute>
      <Layout>
        <VStack spacing={8} align="stretch">
          <HStack justify="space-between" align="start">
            <VStack align="start" spacing={2}>
              <Heading size="xl">Content Schedules</Heading>
              <Text color="gray.600">
                Automate your content generation with scheduled posts
              </Text>
              <Text fontSize="sm" color="gray.500">
                {planLimits.maxSchedules === -1 
                  ? 'Unlimited schedules' 
                  : `${schedules.length}/${planLimits.maxSchedules} schedules used`
                }
              </Text>
            </VStack>
            
            <HStack>
              <Button
                colorScheme="green"
                variant="outline"
                onClick={handleTestQStash}
                size="sm"
              >
                🚀 QStash 테스트
              </Button>
              <Button
                leftIcon={<AddIcon />}
                colorScheme="brand"
                onClick={canCreateSchedule ? onOpen : onUpgradeOpen}
              >
                {canCreateSchedule ? 'Create Schedule' : 'Upgrade to Create'}
              </Button>
            </HStack>
          </HStack>

          {!planLimits.autoGeneration && (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text fontWeight="semibold">Auto-generation requires Pro plan</Text>
                <Text fontSize="sm">
                  Upgrade to Pro or Premium to enable automatic content generation and publishing.
                </Text>
                <Button size="sm" mt={2} onClick={onUpgradeOpen}>
                  Upgrade Now
                </Button>
              </Box>
            </Alert>
          )}

          {loading ? (
            <Center py={20}>
              <VStack spacing={4}>
                <Spinner size="lg" color="brand.500" />
                <Text>Loading your schedules...</Text>
              </VStack>
            </Center>
          ) : error ? (
            <Center py={20}>
              <VStack spacing={4}>
                <Text color="red.500">Error loading schedules</Text>
                <Text fontSize="sm" color="gray.500">{error}</Text>
              </VStack>
            </Center>
          ) : schedules.length === 0 ? (
            <Center py={20}>
              <VStack spacing={6} textAlign="center">
                <Box>
                  <Heading size="md" mb={2}>
                    No schedules yet
                  </Heading>
                  <Text color="gray.600" mb={6}>
                    Create your first automated content schedule to start generating posts regularly.
                  </Text>
                  <Button
                    leftIcon={<AddIcon />}
                    colorScheme="brand"
                    size="lg"
                    onClick={canCreateSchedule ? onOpen : onUpgradeOpen}
                  >
                    {canCreateSchedule ? 'Create Your First Schedule' : 'Upgrade to Get Started'}
                  </Button>
                </Box>
              </VStack>
            </Center>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {schedules.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDeleteSchedule}
                />
              ))}
            </SimpleGrid>
          )}

          {/* Create Schedule Modal */}
          <Modal isOpen={isOpen} onClose={onClose} size="2xl">
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Create New Schedule</ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                <ScheduleForm onSubmit={handleCreateSchedule} />
              </ModalBody>
            </ModalContent>
          </Modal>

          {/* Upgrade Modal */}
          <Modal isOpen={isUpgradeOpen} onClose={onUpgradeClose} size="6xl">
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Upgrade Your Plan</ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                <SubscriptionManager showUpgradeOnly />
              </ModalBody>
            </ModalContent>
          </Modal>
        </VStack>
      </Layout>
    </ProtectedRoute>
  )
}