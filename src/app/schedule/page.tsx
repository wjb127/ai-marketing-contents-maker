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
import { PLAN_LIMITS, CONTENT_TYPE_LABELS, TONE_LABELS } from '@/utils/constants'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

interface PromptTemplate {
  id: string
  name: string
  topic: string
  contentType: string
  tone: string
  targetAudience: string
  additionalInstructions: string
  createdAt: string
}

export default function SchedulePage() {
  const { user: authUser } = useAuth()
  const { user } = useUser()
  const { schedules, loading, error, createSchedule, toggleSchedule, deleteSchedule } = useSchedules()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { 
    isOpen: isPromptModalOpen, 
    onOpen: onPromptModalOpen, 
    onClose: onPromptModalClose 
  } = useDisclosure()
  const toast = useToast()

  // 프롬프트 템플릿 상태
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([])
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    topic: '',
    contentType: 'x_post',
    tone: 'professional',
    targetAudience: '',
    additionalInstructions: '',
    frequency: 'daily',
    timeOfDay: '09:00',
    isActive: true
  })

  const userPlan = user?.subscription_plan || 'free'
  const planLimits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS]

  // 프롬프트 템플릿 로드
  useEffect(() => {
    const savedPrompts = localStorage.getItem('promptTemplates')
    if (savedPrompts) {
      setPromptTemplates(JSON.parse(savedPrompts))
    }
  }, [])

  // 프롬프트 템플릿 저장
  const savePromptTemplates = (templates: PromptTemplate[]) => {
    setPromptTemplates(templates)
    localStorage.setItem('promptTemplates', JSON.stringify(templates))
  }

  // 프롬프트 저장/업데이트
  const handleSavePrompt = () => {
    if (!formData.name || !formData.topic) {
      toast({
        title: '입력 오류',
        description: '프롬프트 이름과 주제를 입력해주세요.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    const newPrompt: PromptTemplate = {
      id: isEditing && selectedPrompt ? selectedPrompt.id : Date.now().toString(),
      name: formData.name,
      topic: formData.topic,
      contentType: formData.contentType,
      tone: formData.tone,
      targetAudience: formData.targetAudience,
      additionalInstructions: formData.additionalInstructions,
      createdAt: isEditing && selectedPrompt ? selectedPrompt.createdAt : new Date().toISOString()
    }

    if (isEditing && selectedPrompt) {
      const updatedPrompts = promptTemplates.map(p => 
        p.id === selectedPrompt.id ? newPrompt : p
      )
      savePromptTemplates(updatedPrompts)
    } else {
      savePromptTemplates([...promptTemplates, newPrompt])
    }

    resetForm()
    onPromptModalClose()
    toast({
      title: isEditing ? '프롬프트 수정 완료' : '프롬프트 저장 완료',
      description: '프롬프트가 성공적으로 저장되었습니다.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  // 프롬프트 삭제
  const handleDeletePrompt = (promptId: string) => {
    const updatedPrompts = promptTemplates.filter(p => p.id !== promptId)
    savePromptTemplates(updatedPrompts)
    toast({
      title: '프롬프트 삭제 완료',
      description: '프롬프트가 삭제되었습니다.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    })
  }

  // 프롬프트 편집
  const handleEditPrompt = (prompt: PromptTemplate) => {
    setSelectedPrompt(prompt)
    setFormData({
      name: prompt.name,
      topic: prompt.topic,
      contentType: prompt.contentType,
      tone: prompt.tone,
      targetAudience: prompt.targetAudience,
      additionalInstructions: prompt.additionalInstructions,
      frequency: 'daily',
      timeOfDay: '09:00',
      isActive: true
    })
    setIsEditing(true)
    onPromptModalOpen()
  }

  // 스케줄 생성
  const handleCreateSchedule = async (prompt: PromptTemplate) => {
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
      await createSchedule({
        name: `${prompt.name} 자동 생성`,
        content_type: prompt.contentType as any,
        content_tone: prompt.tone as any,
        topic: prompt.topic,
        target_audience: prompt.targetAudience,
        additional_instructions: prompt.additionalInstructions,
        frequency: 'daily',
        time_of_day: '09:00',
        timezone: 'Asia/Seoul'
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
      frequency: 'daily',
      timeOfDay: '09:00',
      isActive: true
    })
    setSelectedPrompt(null)
    setIsEditing(false)
  }

  const canCreateSchedule = planLimits.maxSchedules === -1 || schedules.length < planLimits.maxSchedules

  return (
    <ProtectedRoute>
      <Layout>
        <VStack spacing={8} align="stretch">
          {/* 헤더 */}
          <HStack justify="space-between" align="start">
            <VStack align="start" spacing={2}>
              <Heading size="xl" color="gray.800">⏰ 스케줄 관리</Heading>
              <Text color="gray.600" fontSize="lg">
                프롬프트를 저장하고 자동 콘텐츠 생성 스케줄을 설정하세요
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
                  <StatLabel>저장된 프롬프트</StatLabel>
                  <StatNumber>{promptTemplates.length}개</StatNumber>
                  <StatHelpText>생성 준비 완료</StatHelpText>
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

          <Tabs colorScheme="brand">
            <TabList>
              <Tab>📝 프롬프트 템플릿</Tab>
              <Tab>⚡ 활성 스케줄</Tab>
            </TabList>

            <TabPanels>
              {/* 프롬프트 템플릿 탭 */}
              <TabPanel px={0}>
                {promptTemplates.length === 0 ? (
                  <Center py={20}>
                    <VStack spacing={6} textAlign="center">
                      <Box>
                        <Text fontSize="6xl" mb={4}>📝</Text>
                        <Heading size="md" mb={2} color="gray.600">
                          첫 번째 프롬프트를 만들어보세요
                        </Heading>
                        <Text color="gray.500" mb={6}>
                          프롬프트를 저장하면 언제든지 재사용하고 스케줄을 설정할 수 있어요
                        </Text>
                        <Button
                          leftIcon={<AddIcon />}
                          colorScheme="brand"
                          size="lg"
                          onClick={() => {
                            resetForm()
                            onPromptModalOpen()
                          }}
                        >
                          프롬프트 만들기
                        </Button>
                      </Box>
                    </VStack>
                  </Center>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    {promptTemplates.map((prompt) => (
                      <Card key={prompt.id} shadow="sm" _hover={{ shadow: 'md', transform: 'translateY(-2px)' }} transition="all 0.2s">
                        <CardHeader pb={3}>
                          <HStack justify="space-between">
                            <VStack align="start" spacing={1}>
                              <Heading size="sm" color="gray.800">{prompt.name}</Heading>
                              <HStack spacing={2}>
                                <Badge colorScheme="blue" size="sm">
                                  {CONTENT_TYPE_LABELS[prompt.contentType as keyof typeof CONTENT_TYPE_LABELS]}
                                </Badge>
                                <Badge colorScheme="green" size="sm">
                                  {TONE_LABELS[prompt.tone as keyof typeof TONE_LABELS]}
                                </Badge>
                              </HStack>
                            </VStack>
                            <HStack spacing={1}>
                              <IconButton
                                aria-label="프롬프트 수정"
                                icon={<EditIcon />}
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditPrompt(prompt)}
                              />
                              <IconButton
                                aria-label="프롬프트 삭제"
                                icon={<DeleteIcon />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => handleDeletePrompt(prompt.id)}
                              />
                            </HStack>
                          </HStack>
                        </CardHeader>
                        <CardBody pt={0}>
                          <VStack align="start" spacing={3}>
                            <Text fontSize="sm" color="gray.600" noOfLines={2}>
                              <strong>주제:</strong> {prompt.topic}
                            </Text>
                            {prompt.targetAudience && (
                              <Text fontSize="sm" color="gray.600" noOfLines={1}>
                                <strong>타겟:</strong> {prompt.targetAudience}
                              </Text>
                            )}
                            <Divider />
                            <Button
                              size="sm"
                              colorScheme="brand"
                              variant="outline"
                              width="full"
                              leftIcon={<RepeatIcon />}
                              onClick={() => handleCreateSchedule(prompt)}
                              isDisabled={!canCreateSchedule}
                            >
                              {canCreateSchedule ? '스케줄 생성' : '플랜 업그레이드 필요'}
                            </Button>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                )}
              </TabPanel>

              {/* 활성 스케줄 탭 */}
              <TabPanel px={0}>
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
                            <Switch
                              isChecked={schedule.is_active}
                              onChange={(e) => toggleSchedule(schedule.id, e.target.checked)}
                              colorScheme="brand"
                            />
                          </HStack>
                        </CardHeader>
                        <CardBody pt={0}>
                          <VStack align="start" spacing={2}>
                            <Text fontSize="sm" color="gray.600">
                              <strong>주제:</strong> {schedule.topic}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              <strong>빈도:</strong> {schedule.frequency}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              <strong>시간:</strong> {schedule.time_of_day}
                            </Text>
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
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>

          {/* 프롬프트 생성/편집 모달 */}
          <Modal isOpen={isPromptModalOpen} onClose={onPromptModalClose} size="2xl">
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>
                {isEditing ? '프롬프트 수정' : '새 프롬프트 만들기'}
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                <VStack spacing={4}>
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

                  <HStack justify="flex-end" width="full" pt={4}>
                    <Button variant="ghost" onClick={onPromptModalClose}>
                      취소
                    </Button>
                    <Button colorScheme="brand" onClick={handleSavePrompt}>
                      {isEditing ? '수정하기' : '저장하기'}
                    </Button>
                  </HStack>
                </VStack>
              </ModalBody>
            </ModalContent>
          </Modal>
        </VStack>
      </Layout>
    </ProtectedRoute>
  )
}