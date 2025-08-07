'use client'

import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  SimpleGrid,
  Badge,
  useToast,
  Flex,
  Spacer,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Switch,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Card,
  CardHeader,
  CardBody,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  IconButton,
  Tooltip,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react'
import { AddIcon, EditIcon, ViewIcon, DeleteIcon, RepeatIcon, SettingsIcon } from '@chakra-ui/icons'
import { useState, useEffect, useRef } from 'react'
import Layout from '@/components/layout/Layout'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'

interface PromptCategory {
  id: string
  name: string
  description: string
  display_order: number
  is_active: boolean
}

interface PromptTemplate {
  id: string
  category_id: string
  name: string
  title: string
  description?: string
  template: string
  version: number
  is_active: boolean
  variables: string[]
  performance_metrics: any
  change_notes?: string
  created_by: string
  created_at: string
  updated_at: string
  prompt_categories?: {
    name: string
    description: string
  }
}

export default function AdminPromptsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const cancelRef = useRef<HTMLButtonElement>(null)

  // State
  const [categories, setCategories] = useState<PromptCategory[]>([])
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showActiveOnly, setShowActiveOnly] = useState(true)

  // Modal states
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure()
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure()
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null)
  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    title: '',
    description: '',
    template: '',
    variables: '',
    change_notes: '',
    is_active: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load data
  useEffect(() => {
    fetchCategories()
    fetchTemplates()
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [selectedCategory, showActiveOnly])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/prompts/categories')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch categories')
      }
      
      setCategories(data.categories || [])
    } catch (error: any) {
      console.error('❌ Error fetching categories:', error)
      toast({
        title: '카테고리 로드 실패',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }
      if (showActiveOnly) {
        params.append('active_only', 'true')
      }
      
      const response = await fetch(`/api/admin/prompts?${params}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch templates')
      }
      
      setTemplates(data.templates || [])
    } catch (error: any) {
      console.error('❌ Error fetching templates:', error)
      toast({
        title: '템플릿 로드 실패',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
    if (!formData.name || !formData.title || !formData.template) {
      toast({
        title: '입력 오류',
        description: '이름, 제목, 템플릿은 필수 입력사항입니다.',
        status: 'error',
        duration: 3000,
      })
      return
    }

    setIsSubmitting(true)
    try {
      const variables = formData.variables
        ? formData.variables.split(',').map(v => v.trim()).filter(v => v)
        : []

      const response = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          variables,
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create template')
      }

      toast({
        title: '템플릿 생성 완료',
        description: `${formData.title} 템플릿이 생성되었습니다.`,
        status: 'success',
        duration: 3000,
      })

      onCreateClose()
      resetForm()
      fetchTemplates()
    } catch (error: any) {
      console.error('❌ Error creating template:', error)
      toast({
        title: '생성 실패',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return

    setIsSubmitting(true)
    try {
      const variables = formData.variables
        ? formData.variables.split(',').map(v => v.trim()).filter(v => v)
        : []

      const response = await fetch(`/api/admin/prompts/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          variables,
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update template')
      }

      toast({
        title: '템플릿 업데이트 완료',
        description: `${formData.title} 템플릿이 업데이트되었습니다.`,
        status: 'success',
        duration: 3000,
      })

      onEditClose()
      resetForm()
      fetchTemplates()
    } catch (error: any) {
      console.error('❌ Error updating template:', error)
      toast({
        title: '업데이트 실패',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/prompts/${selectedTemplate.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete template')
      }

      toast({
        title: '템플릿 비활성화 완료',
        description: `${selectedTemplate.title} 템플릿이 비활성화되었습니다.`,
        status: 'success',
        duration: 3000,
      })

      onDeleteClose()
      setSelectedTemplate(null)
      fetchTemplates()
    } catch (error: any) {
      console.error('❌ Error deleting template:', error)
      toast({
        title: '비활성화 실패',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      category_id: '',
      name: '',
      title: '',
      description: '',
      template: '',
      variables: '',
      change_notes: '',
      is_active: false
    })
  }

  const openEditModal = (template: PromptTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      category_id: template.category_id,
      name: template.name,
      title: template.title,
      description: template.description || '',
      template: template.template,
      variables: Array.isArray(template.variables) ? template.variables.join(', ') : '',
      change_notes: '',
      is_active: template.is_active
    })
    onEditOpen()
  }

  const openViewModal = (template: PromptTemplate) => {
    setSelectedTemplate(template)
    onViewOpen()
  }

  const openDeleteModal = (template: PromptTemplate) => {
    setSelectedTemplate(template)
    onDeleteOpen()
  }

  const getStatusColor = (isActive: boolean) => isActive ? 'green' : 'gray'

  const filteredTemplates = templates.filter(template => 
    selectedCategory === 'all' || template.category_id === selectedCategory
  )

  return (
    <ProtectedRoute>
      <Layout>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
            <Box>
              <Heading size="xl" mb={2} color="gray.800">
                ⚙️ 프롬프트 템플릿 관리
              </Heading>
              <Text color="gray.600" fontSize="lg">
                AI 콘텐츠 생성에 사용되는 프롬프트 템플릿을 관리하고 버전을 추적하세요
              </Text>
            </Box>
            <Spacer />
            <HStack spacing={3}>
              <Button
                leftIcon={<RepeatIcon />}
                variant="outline"
                onClick={fetchTemplates}
                isLoading={loading}
                size={{ base: 'md', md: 'lg' }}
              >
                새로고침
              </Button>
              <Button
                leftIcon={<AddIcon />}
                colorScheme="brand"
                onClick={onCreateOpen}
                size={{ base: 'md', md: 'lg' }}
                shadow="sm"
              >
                새 템플릿 생성
              </Button>
            </HStack>
          </Flex>

          {/* Filters */}
          <HStack spacing={4} wrap="wrap">
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              maxW="300px"
            >
              <option value="all">모든 카테고리</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} - {category.description}
                </option>
              ))}
            </Select>
            
            <HStack>
              <Text fontSize="sm">활성 템플릿만</Text>
              <Switch
                isChecked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                colorScheme="brand"
              />
            </HStack>
          </HStack>

          {/* Templates Table */}
          {loading ? (
            <Box py={20}>
              <LoadingSpinner text="템플릿을 불러오는 중..." />
            </Box>
          ) : filteredTemplates.length === 0 ? (
            <Box textAlign="center" py={20}>
              <Text fontSize="6xl" mb={4}>📝</Text>
              <Heading size="md" mb={4} color="gray.500">
                템플릿이 없습니다
              </Heading>
              <Text color="gray.400" mb={6}>
                첫 번째 프롬프트 템플릿을 생성해보세요
              </Text>
              <Button
                leftIcon={<AddIcon />}
                colorScheme="brand"
                size="lg"
                onClick={onCreateOpen}
              >
                템플릿 생성하기
              </Button>
            </Box>
          ) : (
            <Card>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>이름</Th>
                    <Th>제목</Th>
                    <Th>버전</Th>
                    <Th>상태</Th>
                    <Th>카테고리</Th>
                    <Th>생성일</Th>
                    <Th>액션</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredTemplates.map((template) => (
                    <Tr key={template.id}>
                      <Td>
                        <Text fontFamily="mono" fontSize="sm">
                          {template.name}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontWeight="semibold">
                          {template.title}
                        </Text>
                      </Td>
                      <Td>
                        <Badge colorScheme="blue" size="sm">
                          v{template.version}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(template.is_active)} size="sm">
                          {template.is_active ? '활성' : '비활성'}
                        </Badge>
                      </Td>
                      <Td>
                        <Text fontSize="sm" color="gray.600">
                          {template.prompt_categories?.name || 'N/A'}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm" color="gray.500">
                          {new Date(template.created_at).toLocaleDateString('ko-KR')}
                        </Text>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <Tooltip label="보기">
                            <IconButton
                              icon={<ViewIcon />}
                              size="sm"
                              variant="ghost"
                              onClick={() => openViewModal(template)}
                            />
                          </Tooltip>
                          <Tooltip label="편집">
                            <IconButton
                              icon={<EditIcon />}
                              size="sm"
                              variant="ghost"
                              colorScheme="blue"
                              onClick={() => openEditModal(template)}
                            />
                          </Tooltip>
                          <Tooltip label="비활성화">
                            <IconButton
                              icon={<DeleteIcon />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => openDeleteModal(template)}
                            />
                          </Tooltip>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Card>
          )}
        </VStack>

        {/* Create/Edit Modal */}
        <Modal isOpen={isCreateOpen || isEditOpen} onClose={isEditOpen ? onEditClose : onCreateClose} size="xl">
          <ModalOverlay />
          <ModalContent maxW="900px">
            <ModalHeader>
              {isEditOpen ? '프롬프트 템플릿 편집' : '새 프롬프트 템플릿 생성'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4} align="stretch">
                <HStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>카테고리</FormLabel>
                    <Select
                      value={formData.category_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                      placeholder="카테고리를 선택하세요"
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name} - {category.description}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>이름 (고유키)</FormLabel>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="예: x_post_generation"
                      fontFamily="mono"
                      isDisabled={isEditOpen} // 편집 시에는 이름 변경 불가
                    />
                  </FormControl>
                </HStack>

                <FormControl isRequired>
                  <FormLabel>제목</FormLabel>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="사용자에게 보여질 제목"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>설명</FormLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="이 템플릿에 대한 설명"
                    rows={2}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>프롬프트 템플릿</FormLabel>
                  <Textarea
                    value={formData.template}
                    onChange={(e) => setFormData(prev => ({ ...prev, template: e.target.value }))}
                    placeholder="{{topic}}, {{tone}} 등의 변수를 사용할 수 있습니다"
                    minH="200px"
                    fontFamily="mono"
                    fontSize="sm"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>변수 목록</FormLabel>
                  <Input
                    value={formData.variables}
                    onChange={(e) => setFormData(prev => ({ ...prev, variables: e.target.value }))}
                    placeholder="쉼표로 구분된 변수 목록: topic, tone, target_audience"
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    템플릿에서 사용되는 변수들을 쉼표로 구분하여 입력하세요
                  </Text>
                </FormControl>

                <FormControl>
                  <FormLabel>변경 사항</FormLabel>
                  <Textarea
                    value={formData.change_notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, change_notes: e.target.value }))}
                    placeholder="이번 버전의 변경 사항을 설명하세요"
                    rows={2}
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="is-active" mb="0">
                    즉시 활성화
                  </FormLabel>
                  <Switch
                    id="is-active"
                    isChecked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    colorScheme="brand"
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <HStack spacing={3}>
                <Button
                  variant="ghost"
                  onClick={isEditOpen ? onEditClose : onCreateClose}
                >
                  취소
                </Button>
                <Button
                  colorScheme="brand"
                  onClick={isEditOpen ? handleUpdateTemplate : handleCreateTemplate}
                  isLoading={isSubmitting}
                  loadingText={isEditOpen ? "업데이트 중..." : "생성 중..."}
                >
                  {isEditOpen ? '업데이트' : '생성'}
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* View Modal */}
        <Modal isOpen={isViewOpen} onClose={onViewClose} size="xl">
          <ModalOverlay />
          <ModalContent maxW="900px">
            <ModalHeader>
              <VStack align="start" spacing={2}>
                <Text fontSize="lg" fontWeight="bold">
                  {selectedTemplate?.title}
                </Text>
                <HStack spacing={2}>
                  <Badge colorScheme="blue" size="sm">
                    v{selectedTemplate?.version}
                  </Badge>
                  <Badge colorScheme={getStatusColor(selectedTemplate?.is_active || false)} size="sm">
                    {selectedTemplate?.is_active ? '활성' : '비활성'}
                  </Badge>
                  <Text fontSize="sm" color="gray.500" fontFamily="mono">
                    {selectedTemplate?.name}
                  </Text>
                </HStack>
              </VStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {selectedTemplate && (
                <VStack align="stretch" spacing={4}>
                  {selectedTemplate.description && (
                    <Box>
                      <Text fontWeight="semibold" mb={2}>설명:</Text>
                      <Text color="gray.600">{selectedTemplate.description}</Text>
                    </Box>
                  )}
                  
                  <Box>
                    <Text fontWeight="semibold" mb={2}>카테고리:</Text>
                    <Text color="gray.600">
                      {selectedTemplate.prompt_categories?.name} - {selectedTemplate.prompt_categories?.description}
                    </Text>
                  </Box>

                  {selectedTemplate.variables?.length > 0 && (
                    <Box>
                      <Text fontWeight="semibold" mb={2}>변수:</Text>
                      <HStack wrap="wrap" spacing={2}>
                        {selectedTemplate.variables.map((variable, index) => (
                          <Badge key={index} colorScheme="purple" size="sm">
                            {`{{${variable}}}`}
                          </Badge>
                        ))}
                      </HStack>
                    </Box>
                  )}
                  
                  <Box>
                    <Text fontWeight="semibold" mb={2}>프롬프트 템플릿:</Text>
                    <Box 
                      p={4} 
                      bg="gray.50" 
                      borderRadius="md" 
                      border="1px solid"
                      borderColor="gray.200"
                      maxH="400px"
                      overflowY="auto"
                    >
                      <Text whiteSpace="pre-wrap" fontSize="sm" fontFamily="mono">
                        {selectedTemplate.template}
                      </Text>
                    </Box>
                  </Box>

                  <HStack spacing={8}>
                    <Box>
                      <Text fontWeight="semibold" mb={1}>생성자:</Text>
                      <Text fontSize="sm" color="gray.600">
                        {selectedTemplate.created_by}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontWeight="semibold" mb={1}>생성일:</Text>
                      <Text fontSize="sm" color="gray.600">
                        {new Date(selectedTemplate.created_at).toLocaleString('ko-KR')}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontWeight="semibold" mb={1}>수정일:</Text>
                      <Text fontSize="sm" color="gray.600">
                        {new Date(selectedTemplate.updated_at).toLocaleString('ko-KR')}
                      </Text>
                    </Box>
                  </HStack>
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <HStack spacing={3}>
                <Button
                  leftIcon={<EditIcon />}
                  colorScheme="blue"
                  onClick={() => {
                    if (selectedTemplate) {
                      onViewClose()
                      openEditModal(selectedTemplate)
                    }
                  }}
                >
                  편집
                </Button>
                <Button variant="ghost" onClick={onViewClose}>
                  닫기
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Delete Confirmation */}
        <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelRef} onClose={onDeleteClose}>
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                템플릿 비활성화
              </AlertDialogHeader>
              <AlertDialogBody>
                <Text mb={3}>
                  <strong>{selectedTemplate?.title}</strong> 템플릿을 비활성화하시겠습니까?
                </Text>
                <Text fontSize="sm" color="gray.600">
                  비활성화된 템플릿은 더 이상 콘텐츠 생성에 사용되지 않지만, 데이터는 보존됩니다.
                </Text>
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteClose}>
                  취소
                </Button>
                <Button
                  colorScheme="red"
                  onClick={handleDeleteTemplate}
                  ml={3}
                  isLoading={isSubmitting}
                  loadingText="비활성화 중..."
                >
                  비활성화
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Layout>
    </ProtectedRoute>
  )
}