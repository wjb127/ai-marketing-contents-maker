'use client'

import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  Select,
  Button,
  SimpleGrid,
  Badge,
  useToast,
  InputGroup,
  InputLeftElement,
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
  Textarea,
  FormControl,
  FormLabel,
  Divider,
  IconButton,
  Tooltip,
} from '@chakra-ui/react'
import { SearchIcon, AddIcon, RepeatIcon, EditIcon, ViewIcon, CopyIcon } from '@chakra-ui/icons'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import ContentCard from '@/components/content/ContentCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Content } from '@/types'
import { CONTENT_TYPE_LABELS, CONTENT_STATUS, TONE_LABELS } from '@/utils/constants'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { useContents } from '@/hooks/useContents'

export default function ContentLibraryPage() {
  const { user } = useAuth()
  const router = useRouter()
  const toast = useToast()
  
  const { contents, loading, error, deleteContent, updateContent, refetch } = useContents()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSource, setFilterSource] = useState('all') // 'all', 'manual', 'scheduled'
  const [refreshing, setRefreshing] = useState(false)
  
  // 모달 상태
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure()
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure()
  const [selectedContent, setSelectedContent] = useState<Content | null>(null)
  const [editFormData, setEditFormData] = useState({
    title: '',
    content: '',
    content_type: '',
    tone: '',
    topic: '',
    status: ''
  })
  const [isUpdating, setIsUpdating] = useState(false)

  // 로깅 추가
  useEffect(() => {
    console.log('📚 Content Library - Contents updated:', contents.length, 'items')
    if (contents.length > 0) {
      console.log('📚 First few contents:', contents.slice(0, 3).map(c => ({
        id: c.id,
        title: c.title,
        content_type: c.content_type,
        created_at: c.created_at
      })))
    }
  }, [contents])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      console.log('🔄 Manually refreshing contents...')
      await refetch()
      toast({
        title: '새로고침 완료',
        description: '콘텐츠 목록을 업데이트했습니다.',
        status: 'success',
        duration: 2000,
      })
    } catch (error) {
      toast({
        title: '새로고침 실패',
        description: '콘텐츠를 불러오는 중 오류가 발생했습니다.',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setRefreshing(false)
    }
  }


  const handleDelete = async (contentId: string) => {
    try {
      await deleteContent(contentId)
      toast({
        title: '콘텐츠 삭제 완료',
        description: '콘텐츠가 성공적으로 삭제되었습니다.',
        status: 'success',
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: '삭제 실패',
        description: '콘텐츠 삭제에 실패했습니다. 다시 시도해주세요.',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleView = (content: Content) => {
    setSelectedContent(content)
    onViewOpen()
  }

  const handleEdit = (content: Content) => {
    // 편집 페이지로 이동
    router.push(`/content/edit/${content.id}`)
  }

  const handleSaveEdit = async () => {
    if (!selectedContent) return

    setIsUpdating(true)
    try {
      await updateContent(selectedContent.id, {
        title: editFormData.title,
        content: editFormData.content,
        content_type: editFormData.content_type as any,
        tone: editFormData.tone as any,
        topic: editFormData.topic,
        status: editFormData.status as any,
        updated_at: new Date().toISOString()
      })

      toast({
        title: '수정 완료',
        description: '콘텐츠가 성공적으로 수정되었습니다.',
        status: 'success',
        duration: 3000,
      })

      onEditClose()
      await refetch() // 목록 새로고침
    } catch (error) {
      toast({
        title: '수정 실패',
        description: '콘텐츠 수정에 실패했습니다. 다시 시도해주세요.',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCopyContent = async (content: Content) => {
    try {
      await navigator.clipboard.writeText(content.content)
      toast({
        title: '복사 완료',
        description: '콘텐츠가 클립보드에 복사되었습니다.',
        status: 'success',
        duration: 2000,
      })
    } catch (error) {
      toast({
        title: '복사 실패',
        description: '클립보드 복사에 실패했습니다.',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleSchedule = (content: Content) => {
    // Here you would open a scheduling modal
    toast({
      title: '스케줄 기능',
      description: '스케줄링 기능이 곧 출시됩니다!',
      status: 'info',
      duration: 3000,
    })
  }


  const filteredContents = contents.filter(content => {
    const matchesSearch = (content.topic || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         content.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (content.title || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'all' || content.content_type === filterType
    const matchesStatus = filterStatus === 'all' || content.status === filterStatus
    
    const matchesSource = filterSource === 'all' || 
                         (filterSource === 'scheduled' && content.schedule_id) ||
                         (filterSource === 'manual' && !content.schedule_id)
    
    return matchesSearch && matchesType && matchesStatus && matchesSource
  })

  const getStatusStats = () => {
    const stats = {
      total: contents.length,
      published: contents.filter(c => c.status === 'published').length,
      draft: contents.filter(c => c.status === 'draft').length,
      scheduled: contents.filter(c => c.status === 'scheduled').length,
      auto_generated: contents.filter(c => c.schedule_id).length,
    }
    return stats
  }

  const stats = getStatusStats()

  return (
    <ProtectedRoute>
      <Layout>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
            <Box>
              <Heading size="xl" mb={2} color="gray.800">
                📚 콘텐츠 라이브러리
              </Heading>
              <Text color="gray.600" fontSize={{ base: "md", md: "lg" }}>
                AI로 생성된 모든 콘텐츠를 한 곳에서 관리하세요
              </Text>
              <SimpleGrid 
                columns={{ base: 2, sm: 3, md: 5 }} 
                spacing={{ base: 2, md: 4 }} 
                mt={2} 
                fontSize={{ base: "xs", md: "sm" }} 
                color="gray.500"
              >
                <Text whiteSpace="nowrap">전체: {stats.total}개</Text>
                <Text whiteSpace="nowrap">발행: {stats.published}개</Text>
                <Text whiteSpace="nowrap">임시저장: {stats.draft}개</Text>
                <Text whiteSpace="nowrap">예약: {stats.scheduled}개</Text>
                <Text whiteSpace="nowrap">자동생성: {stats.auto_generated}개</Text>
              </SimpleGrid>
            </Box>
            <Spacer />
            <VStack spacing={{ base: 2, md: 0 }} align="stretch">
              <HStack spacing={3} justify={{ base: "stretch", md: "flex-end" }}>
                <Button
                  leftIcon={<RepeatIcon />}
                  variant="outline"
                  onClick={handleRefresh}
                  isLoading={refreshing}
                  size={{ base: 'sm', md: 'md' }}
                  flex={{ base: 1, md: "none" }}
                  fontSize={{ base: "xs", md: "sm" }}
                >
                  새로고침
                </Button>
                <Button
                  leftIcon={<AddIcon />}
                  colorScheme="brand"
                  onClick={() => router.push('/content/create')}
                  size={{ base: 'sm', md: 'md' }}
                  flex={{ base: 1, md: "none" }}
                  shadow="sm"
                  fontSize={{ base: "xs", md: "sm" }}
                >
                  새 콘텐츠 만들기
                </Button>
              </HStack>
            </VStack>
          </Flex>

          {/* Filters */}
          <VStack spacing={4} align="stretch">
            {/* Search Bar - Full Width */}
            <InputGroup maxW={{ base: "100%", md: "400px" }}>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="콘텐츠 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                bg="white"
                borderRadius="md"
              />
            </InputGroup>
            
            {/* Filter Selects - Mobile Grid */}
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 2, md: 4 }}>
              <Select
                placeholder="모든 타입"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                bg="white"
                fontSize={{ base: "sm", md: "md" }}
                size={{ base: "sm", md: "md" }}
              >
                {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              
              <Select
                placeholder="모든 상태"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                bg="white"
                fontSize={{ base: "sm", md: "md" }}
                size={{ base: "sm", md: "md" }}
              >
                <option value="published">발행됨</option>
                <option value="draft">임시저장</option>
                <option value="scheduled">예약됨</option>
                <option value="archived">보관됨</option>
              </Select>
              
              <Select
                placeholder="모든 소스"
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                bg="white"
                fontSize={{ base: "sm", md: "md" }}
                size={{ base: "sm", md: "md" }}
              >
                <option value="manual">직접 생성</option>
                <option value="scheduled">자동생성</option>
              </Select>
              
              {/* Filter Reset Button */}
              {(searchTerm || filterType !== 'all' || filterStatus !== 'all' || filterSource !== 'all') && (
                <Button
                  variant="outline"
                  size={{ base: "sm", md: "md" }}
                  fontSize={{ base: "sm", md: "md" }}
                  onClick={() => {
                    setSearchTerm('')
                    setFilterType('all')
                    setFilterStatus('all')
                    setFilterSource('all')
                  }}
                  colorScheme="gray"
                >
                  초기화
                </Button>
              )}
            </SimpleGrid>
          </VStack>

          {/* Content Grid */}
          {loading ? (
            <Box py={20}>
              <LoadingSpinner text="콘텐츠를 불러오는 중..." />
            </Box>
          ) : error ? (
            <Box textAlign="center" py={20}>
              <Heading size="md" mb={4} color="red.500">
                콘텐츠 로드 오류
              </Heading>
              <Text color="gray.400" mb={6}>
                {error}
              </Text>
              <Button
                colorScheme="brand"
                onClick={() => window.location.reload()}
              >
                다시 시도
              </Button>
            </Box>
          ) : filteredContents.length === 0 ? (
            <Box textAlign="center" py={20}>
              <Text fontSize="6xl" mb={4}>📄</Text>
              <Heading size="md" mb={4} color="gray.500">
                {searchTerm || filterType !== 'all' || filterStatus !== 'all' || filterSource !== 'all'
                  ? '필터에 맞는 콘텐츠가 없습니다'
                  : '콘텐츠가 아직 없습니다'
                }
              </Heading>
              <Text color="gray.400" mb={6}>
                {searchTerm || filterType !== 'all' || filterStatus !== 'all' || filterSource !== 'all'
                  ? '검색어나 필터를 조정해보세요'
                  : '첫 번째 콘텐츠를 만들어보세요'
                }
              </Text>
              <Button
                leftIcon={<AddIcon />}
                colorScheme="brand"
                size="lg"
                onClick={() => router.push('/content/create')}
              >
                첫 콘텐츠 만들기
              </Button>
            </Box>
          ) : (
            <>
              <Text fontSize="sm" color="gray.600">
                전체 {contents.length}개 중 {filteredContents.length}개 표시
              </Text>
              <SimpleGrid columns={{ base: 2, md: 2, lg: 3, xl: 4 }} spacing={{ base: 3, md: 4, lg: 6 }}>
                {filteredContents.map((content) => (
                  <ContentCard
                    key={content.id}
                    content={content}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onSchedule={handleSchedule}
                    onView={handleView}
                    onCopy={handleCopyContent}
                  />
                ))}
              </SimpleGrid>
            </>
          )}
        </VStack>

        {/* View Modal */}
        <Modal isOpen={isViewOpen} onClose={onViewClose} size="xl">
          <ModalOverlay />
          <ModalContent maxW="800px">
            <ModalHeader>
              <VStack align="start" spacing={2}>
                <Text fontSize="lg" fontWeight="bold">
                  {selectedContent?.title || 'Untitled'}
                </Text>
                <HStack spacing={2}>
                  <Badge colorScheme="blue" size="sm">
                    {CONTENT_TYPE_LABELS[selectedContent?.content_type as keyof typeof CONTENT_TYPE_LABELS] || selectedContent?.content_type}
                  </Badge>
                  <Badge colorScheme="green" size="sm">
                    {selectedContent?.tone}
                  </Badge>
                  <Badge colorScheme="orange" size="sm">
                    {selectedContent?.status}
                  </Badge>
                </HStack>
              </VStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontWeight="semibold" mb={2}>주제:</Text>
                  <Text color="gray.600">{selectedContent?.topic || 'N/A'}</Text>
                </Box>
                
                <Divider />
                
                <Box>
                  <Text fontWeight="semibold" mb={2}>콘텐츠:</Text>
                  <Box 
                    p={4} 
                    bg="gray.50" 
                    borderRadius="md" 
                    border="1px solid"
                    borderColor="gray.200"
                    maxH="400px"
                    overflowY="auto"
                  >
                    <Text whiteSpace="pre-wrap" fontSize="sm">
                      {selectedContent?.content}
                    </Text>
                  </Box>
                </Box>

                {selectedContent?.created_at && (
                  <Box>
                    <Text fontWeight="semibold" mb={1}>생성 시간:</Text>
                    <Text fontSize="sm" color="gray.600">
                      {new Date(selectedContent.created_at).toLocaleString('ko-KR')}
                    </Text>
                  </Box>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <HStack spacing={3}>
                <Button
                  leftIcon={<CopyIcon />}
                  onClick={() => selectedContent && handleCopyContent(selectedContent)}
                  variant="outline"
                >
                  복사
                </Button>
                <Button
                  leftIcon={<EditIcon />}
                  colorScheme="blue"
                  onClick={() => {
                    if (selectedContent) {
                      onViewClose()
                      handleEdit(selectedContent)
                    }
                  }}
                >
                  편집
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Edit Modal */}
        <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
          <ModalOverlay />
          <ModalContent maxW="800px">
            <ModalHeader>콘텐츠 편집</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>제목</FormLabel>
                  <Input
                    value={editFormData.title}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="콘텐츠 제목을 입력하세요"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>주제</FormLabel>
                  <Input
                    value={editFormData.topic}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, topic: e.target.value }))}
                    placeholder="콘텐츠 주제를 입력하세요"
                  />
                </FormControl>

                <HStack spacing={4}>
                  <FormControl>
                    <FormLabel>콘텐츠 클리셰</FormLabel>
                    <Select
                      value={editFormData.content_type}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, content_type: e.target.value }))}
                    >
                      {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>톤</FormLabel>
                    <Select
                      value={editFormData.tone}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, tone: e.target.value }))}
                    >
                      {Object.entries(TONE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>상태</FormLabel>
                    <Select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="draft">초안</option>
                      <option value="published">발행됨</option>
                      <option value="scheduled">예약됨</option>
                      <option value="archived">보관됨</option>
                    </Select>
                  </FormControl>
                </HStack>

                <FormControl>
                  <FormLabel>콘텐츠</FormLabel>
                  <Textarea
                    value={editFormData.content}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="콘텐츠 내용을 입력하세요"
                    minH="300px"
                    resize="vertical"
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <HStack spacing={3}>
                <Button variant="ghost" onClick={onEditClose}>
                  취소
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={handleSaveEdit}
                  isLoading={isUpdating}
                  loadingText="저장 중..."
                >
                  저장
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Layout>
    </ProtectedRoute>
  )
}