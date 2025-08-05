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
  Card,
  CardBody,
  CardHeader,
  Badge,
  IconButton,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Switch,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react'
import { AddIcon, DeleteIcon, EditIcon, TimeIcon, RepeatIcon } from '@chakra-ui/icons'
import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import { useAuth } from '@/hooks/useAuth'
import { useUser } from '@/hooks/useUser'
import { useSchedules } from '@/hooks/useSchedules'
import { usePrompts } from '@/hooks/usePrompts'
import { PLAN_LIMITS, CONTENT_TYPE_LABELS, TONE_LABELS, FREQUENCY_LABELS } from '@/utils/constants'
import ProtectedRoute from '@/components/auth/ProtectedRoute'


export default function SchedulePage() {
  const { user: authUser } = useAuth()
  const { user } = useUser()
  const { schedules, loading, error, createSchedule, toggleSchedule, deleteSchedule, updateSchedule } = useSchedules()
  const { 
    prompts: promptTemplates, 
    loading: promptsLoading, 
    createPrompt, 
    updatePrompt, 
    deletePrompt, 
    migrateFromLocalStorage 
  } = usePrompts()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { 
    isOpen: isPromptModalOpen, 
    onOpen: onPromptModalOpen, 
    onClose: onPromptModalClose 
  } = useDisclosure()
  const {
    isOpen: isScheduleEditOpen,
    onOpen: onScheduleEditOpen,
    onClose: onScheduleEditClose
  } = useDisclosure()
  const toast = useToast()

  // 프롬프트 템플릿 상태 (이제 usePrompts 훅에서 관리)
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null)

  // 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    topic: '',
    contentType: 'x_post',
    tone: 'professional',
    targetAudience: '',
    additionalInstructions: '',
    promptType: 'auto' as 'auto' | 'custom',
    customPrompt: '',
    frequency: 'daily',
    timeOfDay: '09:00',
    isActive: true
  })

  const [scheduleFormData, setScheduleFormData] = useState({
    name: '',
    topic: '',
    contentType: 'x_post',
    tone: 'professional',
    targetAudience: '',
    additionalInstructions: '',
    promptType: 'auto' as 'auto' | 'custom',
    customPrompt: '',
    frequency: 'daily',
    timeOfDay: '09:00',
    isActive: true
  })

  const userPlan = user?.subscription_plan || 'free'
  const planLimits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS]

  // 기존 localStorage 데이터 마이그레이션
  useEffect(() => {
    const hasLocalData = localStorage.getItem('promptTemplates')
    if (hasLocalData && !promptsLoading && promptTemplates.length === 0) {
      migrateFromLocalStorage()
    }
  }, [promptsLoading, promptTemplates.length, migrateFromLocalStorage])


  // 프롬프트 저장/업데이트
  const handleSavePrompt = async () => {
    // 자동 프롬프트의 경우 이름과 주제 필수
    if (formData.promptType === 'auto' && (!formData.name || !formData.topic)) {
      toast({
        title: '입력 오류',
        description: '프롬프트 이름과 주제를 입력해주세요.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // 커스텀 프롬프트의 경우 이름과 커스텀 프롬프트 필수
    if (formData.promptType === 'custom' && (!formData.name || !formData.customPrompt)) {
      toast({
        title: '입력 오류',
        description: '프롬프트 이름과 커스텀 프롬프트를 입력해주세요.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    const promptData = {
      name: formData.name,
      topic: formData.topic,
      content_type: formData.contentType,
      tone: formData.tone,
      target_audience: formData.targetAudience,
      additional_instructions: formData.additionalInstructions,
      prompt_type: formData.promptType,
      custom_prompt: formData.customPrompt,
      is_active: true
    }

    let savedPrompt
    if (isEditing && selectedPrompt) {
      savedPrompt = await updatePrompt(selectedPrompt.id, promptData)
    } else {
      savedPrompt = await createPrompt(promptData)
    }

    // 스케줄 생성이 활성화된 경우 바로 스케줄 생성
    if (formData.isActive && savedPrompt) {
      try {
        await handleCreateSchedule(savedPrompt)
      } catch (error) {
        console.error('스케줄 생성 중 오류:', error)
        toast({
          title: '스케줄 생성 실패',
          description: '프롬프트는 저장되었지만 스케줄 생성에 실패했습니다.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        })
      }
    }

    resetForm()
    onPromptModalClose()
    toast({
      title: isEditing ? '프롬프트 수정 완료' : formData.isActive ? '프롬프트 저장 및 스케줄 생성 완료' : '프롬프트 저장 완료',
      description: formData.isActive ? '프롬프트가 저장되고 자동 스케줄이 생성되었습니다.' : '프롬프트가 성공적으로 저장되었습니다.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  // 프롬프트 삭제
  const handleDeletePrompt = async (promptId: string) => {
    try {
      await deletePrompt(promptId)
      toast({
        title: '프롬프트 삭제 완료',
        description: '프롬프트가 삭제되었습니다.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: '프롬프트 삭제 실패',
        description: '프롬프트 삭제 중 오류가 발생했습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  // 프롬프트 편집
  const handleEditPrompt = (prompt: any) => {
    setSelectedPrompt(prompt)
    setFormData({
      name: prompt.name,
      topic: prompt.topic,
      contentType: prompt.content_type,
      tone: prompt.tone,
      targetAudience: prompt.target_audience,
      additionalInstructions: prompt.additional_instructions,
      promptType: prompt.prompt_type || 'auto',
      customPrompt: prompt.custom_prompt || '',
      frequency: 'daily',
      timeOfDay: '09:00',
      isActive: true
    })
    setIsEditing(true)
    onPromptModalOpen()
  }

  // 스케줄 테스트 (즉시 실행)
  const handleTestSchedule = async (scheduleId: string) => {
    try {
      const response = await fetch('/api/schedule/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scheduleId }),
      })

      if (!response.ok) {
        throw new Error('스케줄 실행에 실패했습니다.')
      }

      toast({
        title: '스케줄 실행 완료',
        description: '콘텐츠가 성공적으로 생성되었습니다. 콘텐츠 라이브러리에서 확인하세요.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } catch (error) {
      console.error('스케줄 테스트 중 오류:', error)
      toast({
        title: '스케줄 실행 실패',
        description: '스케줄 실행 중 오류가 발생했습니다.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  // 스케줄 생성
  const handleCreateSchedule = async (prompt: any) => {
    if (planLimits.maxSchedules !== -1 && schedules.length >= planLimits.maxSchedules) {
      toast({
        title: '스케줄 한계 도달',
        description: '현재 플랜에서 생성할 수 있는 스케줄 개수를 초과했습니다.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    try {
      // 프롬프트 정보를 settings에 저장
      const promptSettings = {
        promptType: prompt.prompt_type,
        customPrompt: prompt.custom_prompt,
        originalPromptId: prompt.id
      }

      await createSchedule({
        name: `${prompt.name} 자동 생성`,
        content_type: prompt.content_type as any,
        content_tone: prompt.tone as any,
        topic: prompt.topic,
        target_audience: prompt.target_audience,
        additional_instructions: prompt.additional_instructions,
        frequency: formData.frequency as any,
        time_of_day: formData.timeOfDay,
        timezone: 'Asia/Seoul',
        settings: promptSettings
      })
      
      toast({
        title: '스케줄 생성 완료',
        description: '프롬프트 기반 스케줄이 성공적으로 생성되었습니다.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: '스케줄 생성 실패',
        description: '스케줄 생성 중 오류가 발생했습니다.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  // 폼 리셋
  const resetForm = () => {
    setFormData({
      name: '',
      topic: '',
      contentType: 'x_post',
      tone: 'professional',
      targetAudience: '',
      additionalInstructions: '',
      promptType: 'auto',
      customPrompt: '',
      frequency: 'daily',
      timeOfDay: '09:00',
      isActive: true
    })
    setSelectedPrompt(null)
    setIsEditing(false)
  }

  const canCreateSchedule = planLimits.maxSchedules === -1 || schedules.length < planLimits.maxSchedules

  // 스케줄 편집 함수
  const handleUpdateSchedule = async () => {
    if (!selectedSchedule) return

    try {
      await updateSchedule(selectedSchedule.id, {
        name: scheduleFormData.name,
        content_type: scheduleFormData.contentType as any,
        content_tone: scheduleFormData.tone as any,
        topic: scheduleFormData.topic,
        topics: [scheduleFormData.topic],
        target_audience: scheduleFormData.targetAudience,
        additional_instructions: scheduleFormData.additionalInstructions,
        frequency: scheduleFormData.frequency as any,
        time_of_day: scheduleFormData.timeOfDay,
        is_active: scheduleFormData.isActive,
        settings: {
          ...selectedSchedule.settings,
          promptType: scheduleFormData.promptType,
          customPrompt: scheduleFormData.customPrompt
        }
      })

      onScheduleEditClose()
      toast({
        title: '스케줄 수정 완료',
        description: '스케줄이 성공적으로 수정되었습니다.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: '스케줄 수정 실패',
        description: '스케줄 수정 중 오류가 발생했습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  return (
    <ProtectedRoute>
      <Layout>
        <VStack spacing={8} align="stretch">
          {/* 헤더 */}
          <HStack justify="space-between" align="start">
            <VStack align="start" spacing={2}>
              <Heading size="xl" color="gray.800">⏰ 스케줄 관리</Heading>
              <Text color="gray.600" fontSize="lg">
                자동 콘텐츠 생성 스케줄을 관리하세요
              </Text>
            </VStack>
            
            <Button
              leftIcon={<AddIcon />}
              colorScheme="brand"
              onClick={() => {
                resetForm()
                onPromptModalOpen()
              }}
              shadow="sm"
            >
              새 프롬프트 만들기
            </Button>
          </HStack>

          {/* 통계 카드 */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>전체 스케줄</StatLabel>
                  <StatNumber>{schedules.length}개</StatNumber>
                  <StatHelpText>등록된 스케줄</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>활성 스케줄</StatLabel>
                  <StatNumber>{schedules.filter(s => s.is_active).length}개</StatNumber>
                  <StatHelpText>
                    {planLimits.maxSchedules === -1 
                      ? '무제한' 
                      : `${schedules.length}/${planLimits.maxSchedules} 사용 중`
                    }
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>오늘 생성 예정</StatLabel>
                  <StatNumber>{schedules.filter(s => s.is_active).length}개</StatNumber>
                  <StatHelpText>자동 콘텐츠</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* 활성 스케줄 목록 */}
          <Box>
            {loading ? (
                  <Center py={20}>
                    <VStack spacing={4}>
                      <Spinner size="lg" color="brand.500" />
                      <Text>스케줄을 불러오는 중...</Text>
                    </VStack>
                  </Center>
                ) : schedules.length === 0 ? (
                  <Center py={20}>
                    <VStack spacing={6} textAlign="center">
                      <Box>
                        <Text fontSize="6xl" mb={4}>⚡</Text>
                        <Heading size="md" mb={2} color="gray.600">
                          활성 스케줄이 없습니다
                        </Heading>
                        <Text color="gray.500" mb={6}>
                          프롬프트를 생성하고 스케줄을 설정해보세요
                        </Text>
                      </Box>
                    </VStack>
                  </Center>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    {schedules.map((schedule) => (
                      <Card key={schedule.id} shadow="sm">
                        <CardHeader>
                          <HStack justify="space-between">
                            <VStack align="start" spacing={1}>
                              <Heading size="sm">{schedule.name}</Heading>
                              <Badge colorScheme={schedule.is_active ? 'green' : 'gray'}>
                                {schedule.is_active ? '활성' : '비활성'}
                              </Badge>
                            </VStack>
                            <HStack spacing={1}>
                              <IconButton
                                aria-label="스케줄 편집"
                                icon={<EditIcon />}
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedSchedule(schedule)
                                  setScheduleFormData({
                                    name: schedule.name,
                                    topic: schedule.topics?.[0] || schedule.topic || '',
                                    contentType: schedule.content_type,
                                    tone: schedule.content_tone || schedule.tone,
                                    targetAudience: schedule.target_audience || '',
                                    additionalInstructions: schedule.additional_instructions || '',
                                    promptType: schedule.settings?.promptType || 'auto',
                                    customPrompt: schedule.settings?.customPrompt || '',
                                    frequency: schedule.frequency,
                                    timeOfDay: schedule.time_of_day || schedule.time,
                                    isActive: schedule.is_active
                                  })
                                  onScheduleEditOpen()
                                }}
                              />
                              <Switch
                                isChecked={schedule.is_active}
                                onChange={(e) => toggleSchedule(schedule.id, e.target.checked)}
                                colorScheme="brand"
                              />
                            </HStack>
                          </HStack>
                        </CardHeader>
                        <CardBody pt={0}>
                          <VStack align="start" spacing={2}>
                            <Text fontSize="sm" color="gray.600">
                              <strong>주제:</strong> {schedule.topics?.[0] || schedule.topic || ''}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              <strong>빈도:</strong> {schedule.frequency}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              <strong>시간:</strong> {schedule.time_of_day}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              <strong>생성 횟수:</strong> {schedule.total_generated || 0}회
                            </Text>
                            {schedule.last_run_at && (
                              <Text fontSize="xs" color="gray.500">
                                마지막 실행: {new Date(schedule.last_run_at).toLocaleString('ko-KR')}
                              </Text>
                            )}
                            <VStack spacing={2} width="full">
                              <Button
                                size="sm"
                                colorScheme="brand"
                                variant="outline"
                                width="full"
                                leftIcon={<TimeIcon />}
                                onClick={() => handleTestSchedule(schedule.id)}
                              >
                                지금 실행하기
                              </Button>
                              <Button
                                size="sm"
                                colorScheme="red"
                                variant="outline"
                                width="full"
                                leftIcon={<DeleteIcon />}
                                onClick={() => deleteSchedule(schedule.id)}
                              >
                                스케줄 삭제
                              </Button>
                            </VStack>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                )}
          </Box>

          {/* 프롬프트 생성/편집 모달 */}
          <Modal isOpen={isPromptModalOpen} onClose={onPromptModalClose} size="2xl">
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>
                {isEditing ? '프롬프트 수정' : '새 프롬프트 만들기'}
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                <Tabs 
                  colorScheme="brand" 
                  variant="enclosed"
                  index={formData.promptType === 'auto' ? 0 : 1}
                  onChange={(index) => setFormData({...formData, promptType: index === 0 ? 'auto' : 'custom'})}
                >
                  <TabList>
                    <Tab>🤖 자동 프롬프트</Tab>
                    <Tab>✏️ 커스텀 프롬프트</Tab>
                  </TabList>

                  <TabPanels>
                    {/* 자동 프롬프트 탭 */}
                    <TabPanel px={0}>
                      <VStack spacing={4} mt={4}>
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          <Box>
                            <Text fontSize="sm">
                              <strong>자동 프롬프트:</strong> 입력한 정보를 바탕으로 AI가 최적화된 프롬프트를 자동으로 생성합니다.
                            </Text>
                          </Box>
                        </Alert>

                        <FormControl isRequired>
                          <FormLabel>프롬프트 이름</FormLabel>
                          <Input
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="예: 마케팅 팁 시리즈"
                          />
                        </FormControl>

                        <Grid templateColumns="repeat(2, 1fr)" gap={4} width="full">
                          <GridItem>
                            <FormControl isRequired>
                              <FormLabel>콘텐츠 타입</FormLabel>
                              <Select
                                value={formData.contentType}
                                onChange={(e) => setFormData({...formData, contentType: e.target.value})}
                              >
                                {Object.entries(CONTENT_TYPE_LABELS).map(([key, label]) => (
                                  <option key={key} value={key}>{label}</option>
                                ))}
                              </Select>
                            </FormControl>
                          </GridItem>
                          <GridItem>
                            <FormControl>
                              <FormLabel>톤앤매너</FormLabel>
                              <Select
                                value={formData.tone}
                                onChange={(e) => setFormData({...formData, tone: e.target.value})}
                              >
                                {Object.entries(TONE_LABELS).map(([key, label]) => (
                                  <option key={key} value={key}>{label}</option>
                                ))}
                              </Select>
                            </FormControl>
                          </GridItem>
                        </Grid>

                        <FormControl isRequired>
                          <FormLabel>주제</FormLabel>
                          <Input
                            value={formData.topic}
                            onChange={(e) => setFormData({...formData, topic: e.target.value})}
                            placeholder="예: 소상공인을 위한 디지털 마케팅 전략"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel>타겟 오디언스</FormLabel>
                          <Input
                            value={formData.targetAudience}
                            onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
                            placeholder="예: 20-30대 직장인, 스타트업 창업자"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel>추가 지시사항</FormLabel>
                          <Textarea
                            value={formData.additionalInstructions}
                            onChange={(e) => setFormData({...formData, additionalInstructions: e.target.value})}
                            placeholder="AI에게 전달할 추가 지시사항이나 스타일 가이드를 입력하세요"
                            rows={4}
                          />
                        </FormControl>

                        <Divider />

                        <VStack spacing={4} align="stretch">
                          <Text fontSize="md" fontWeight="semibold" color="gray.700">
                            🔄 자동 스케줄 설정 (선택사항)
                          </Text>
                          
                          <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                            <GridItem>
                              <FormControl>
                                <FormLabel>실행 빈도</FormLabel>
                                <Select
                                  value={formData.frequency}
                                  onChange={(e) => setFormData({...formData, frequency: e.target.value as any})}
                                >
                                  {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                  ))}
                                </Select>
                              </FormControl>
                            </GridItem>
                            <GridItem>
                              <FormControl>
                                <FormLabel>실행 시간</FormLabel>
                                <Input
                                  type="time"
                                  value={formData.timeOfDay}
                                  onChange={(e) => setFormData({...formData, timeOfDay: e.target.value})}
                                />
                              </FormControl>
                            </GridItem>
                          </Grid>

                          <FormControl display="flex" alignItems="center">
                            <Switch
                              id="create-schedule"
                              isChecked={formData.isActive}
                              onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                              colorScheme="brand"
                            />
                            <FormLabel htmlFor="create-schedule" ml={3} mb={0}>
                              프롬프트 저장과 함께 바로 스케줄 생성하기
                            </FormLabel>
                          </FormControl>
                        </VStack>
                      </VStack>
                    </TabPanel>

                    {/* 커스텀 프롬프트 탭 */}
                    <TabPanel px={0}>
                      <VStack spacing={4} mt={4}>
                        <Alert status="warning" borderRadius="md">
                          <AlertIcon />
                          <Box>
                            <Text fontSize="sm">
                              <strong>커스텀 프롬프트:</strong> 직접 작성한 프롬프트를 사용합니다. 고급 사용자에게 권장됩니다.
                            </Text>
                          </Box>
                        </Alert>

                        <FormControl isRequired>
                          <FormLabel>프롬프트 이름</FormLabel>
                          <Input
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="예: 나만의 커스텀 프롬프트"
                          />
                        </FormControl>

                        <Grid templateColumns="repeat(2, 1fr)" gap={4} width="full">
                          <GridItem>
                            <FormControl isRequired>
                              <FormLabel>콘텐츠 타입</FormLabel>
                              <Select
                                value={formData.contentType}
                                onChange={(e) => setFormData({...formData, contentType: e.target.value})}
                              >
                                {Object.entries(CONTENT_TYPE_LABELS).map(([key, label]) => (
                                  <option key={key} value={key}>{label}</option>
                                ))}
                              </Select>
                            </FormControl>
                          </GridItem>
                          <GridItem>
                            <FormControl>
                              <FormLabel>톤앤매너</FormLabel>
                              <Select
                                value={formData.tone}
                                onChange={(e) => setFormData({...formData, tone: e.target.value})}
                              >
                                {Object.entries(TONE_LABELS).map(([key, label]) => (
                                  <option key={key} value={key}>{label}</option>
                                ))}
                              </Select>
                            </FormControl>
                          </GridItem>
                        </Grid>

                        <FormControl isRequired>
                          <FormLabel>커스텀 프롬프트</FormLabel>
                          <Textarea
                            value={formData.customPrompt || ''}
                            onChange={(e) => setFormData({...formData, customPrompt: e.target.value})}
                            placeholder="AI에게 전달할 전체 프롬프트를 직접 작성하세요. 예:&#10;&#10;다음 조건에 맞는 마케팅 콘텐츠를 작성해주세요:&#10;- 대상: 20-30대 직장인&#10;- 목적: 브랜드 인지도 향상&#10;- 스타일: 친근하고 유머러스하게&#10;- 길이: 200-300자 내외"
                            rows={8}
                            resize="vertical"
                          />
                        </FormControl>

                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          <Box>
                            <Text fontSize="sm">
                              💡 <strong>팁:</strong> 명확하고 구체적인 지시사항을 포함하면 더 좋은 결과를 얻을 수 있습니다.
                            </Text>
                          </Box>
                        </Alert>
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>

                <HStack justify="flex-end" width="full" pt={6} borderTop="1px solid" borderColor="gray.200" mt={6}>
                  <Button variant="ghost" onClick={onPromptModalClose}>
                    취소
                  </Button>
                  <Button colorScheme="brand" onClick={handleSavePrompt}>
                    {isEditing ? '수정하기' : '저장하기'}
                  </Button>
                </HStack>
              </ModalBody>
            </ModalContent>
          </Modal>

          {/* 스케줄 편집 모달 */}
          <Modal isOpen={isScheduleEditOpen} onClose={onScheduleEditClose} size="2xl">
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>
                스케줄 편집
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>스케줄 이름</FormLabel>
                    <Input
                      value={scheduleFormData.name}
                      onChange={(e) => setScheduleFormData({...scheduleFormData, name: e.target.value})}
                      placeholder="예: 매일 아침 마케팅 팁"
                    />
                  </FormControl>

                  <Grid templateColumns="repeat(2, 1fr)" gap={4} width="full">
                    <GridItem>
                      <FormControl isRequired>
                        <FormLabel>콘텐츠 타입</FormLabel>
                        <Select
                          value={scheduleFormData.contentType}
                          onChange={(e) => setScheduleFormData({...scheduleFormData, contentType: e.target.value})}
                        >
                          {Object.entries(CONTENT_TYPE_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </Select>
                      </FormControl>
                    </GridItem>
                    <GridItem>
                      <FormControl>
                        <FormLabel>톤앤매너</FormLabel>
                        <Select
                          value={scheduleFormData.tone}
                          onChange={(e) => setScheduleFormData({...scheduleFormData, tone: e.target.value})}
                        >
                          {Object.entries(TONE_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </Select>
                      </FormControl>
                    </GridItem>
                  </Grid>

                  <FormControl isRequired>
                    <FormLabel>주제</FormLabel>
                    <Input
                      value={scheduleFormData.topic}
                      onChange={(e) => setScheduleFormData({...scheduleFormData, topic: e.target.value})}
                      placeholder="예: 소상공인을 위한 디지털 마케팅 전략"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>타겟 오디언스</FormLabel>
                    <Input
                      value={scheduleFormData.targetAudience}
                      onChange={(e) => setScheduleFormData({...scheduleFormData, targetAudience: e.target.value})}
                      placeholder="예: 20-30대 직장인, 스타트업 창업자"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>추가 지시사항</FormLabel>
                    <Textarea
                      value={scheduleFormData.additionalInstructions}
                      onChange={(e) => setScheduleFormData({...scheduleFormData, additionalInstructions: e.target.value})}
                      placeholder="AI에게 전달할 추가 지시사항이나 스타일 가이드를 입력하세요"
                      rows={3}
                    />
                  </FormControl>

                  {scheduleFormData.promptType === 'custom' && (
                    <FormControl>
                      <FormLabel>커스텀 프롬프트</FormLabel>
                      <Textarea
                        value={scheduleFormData.customPrompt}
                        onChange={(e) => setScheduleFormData({...scheduleFormData, customPrompt: e.target.value})}
                        placeholder="커스텀 프롬프트를 입력하세요"
                        rows={5}
                      />
                    </FormControl>
                  )}

                  <Divider />

                  <Grid templateColumns="repeat(2, 1fr)" gap={4} width="full">
                    <GridItem>
                      <FormControl>
                        <FormLabel>실행 빈도</FormLabel>
                        <Select
                          value={scheduleFormData.frequency}
                          onChange={(e) => setScheduleFormData({...scheduleFormData, frequency: e.target.value})}
                        >
                          {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </Select>
                      </FormControl>
                    </GridItem>
                    <GridItem>
                      <FormControl>
                        <FormLabel>실행 시간</FormLabel>
                        <Input
                          type="time"
                          value={scheduleFormData.timeOfDay}
                          onChange={(e) => setScheduleFormData({...scheduleFormData, timeOfDay: e.target.value})}
                        />
                      </FormControl>
                    </GridItem>
                  </Grid>

                  <FormControl display="flex" alignItems="center">
                    <Switch
                      id="schedule-active"
                      isChecked={scheduleFormData.isActive}
                      onChange={(e) => setScheduleFormData({...scheduleFormData, isActive: e.target.checked})}
                      colorScheme="brand"
                    />
                    <FormLabel htmlFor="schedule-active" ml={3} mb={0}>
                      스케줄 활성화
                    </FormLabel>
                  </FormControl>
                </VStack>

                <HStack justify="flex-end" width="full" pt={6} borderTop="1px solid" borderColor="gray.200" mt={6}>
                  <Button variant="ghost" onClick={onScheduleEditClose}>
                    취소
                  </Button>
                  <Button colorScheme="brand" onClick={handleUpdateSchedule}>
                    수정하기
                  </Button>
                </HStack>
              </ModalBody>
            </ModalContent>
          </Modal>
        </VStack>
      </Layout>
    </ProtectedRoute>
  )
}