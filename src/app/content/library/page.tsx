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
} from '@chakra-ui/react'
import { SearchIcon, AddIcon } from '@chakra-ui/icons'
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
  
  const { contents, loading, error, deleteContent, updateContent } = useContents()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')


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

  const handleEdit = (content: Content) => {
    // Here you would navigate to an edit page or open an edit modal
    toast({
      title: '편집 기능',
      description: '편집 기능이 곧 출시됩니다!',
      status: 'info',
      duration: 3000,
    })
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

  const handleView = (content: Content) => {
    // Here you would navigate to a detailed view
    toast({
      title: '콘텐츠 보기',
      description: '상세 보기 기능이 곧 출시됩니다!',
      status: 'info',
      duration: 3000,
    })
  }

  const filteredContents = contents.filter(content => {
    const matchesSearch = (content.topic || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         content.content.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'all' || content.type === filterType
    const matchesStatus = filterStatus === 'all' || content.status === filterStatus
    
    return matchesSearch && matchesType && matchesStatus
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
              <Text color="gray.600" fontSize="lg">
                AI로 생성된 모든 콘텐츠를 한 곳에서 관리하세요
              </Text>
              <HStack spacing={4} mt={2} fontSize="sm" color="gray.500">
                <Text>전체: {stats.total}개</Text>
                <Text>발행: {stats.published}개</Text>
                <Text>임시저장: {stats.draft}개</Text>
                <Text>예약: {stats.scheduled}개</Text>
                <Text>자동생성: {stats.auto_generated}개</Text>
              </HStack>
            </Box>
            <Spacer />
            <Button
              leftIcon={<AddIcon />}
              colorScheme="brand"
              onClick={() => router.push('/content/create')}
              size={{ base: 'md', md: 'lg' }}
              shadow="sm"
            >
              새 콘텐츠 만들기
            </Button>
          </Flex>

          {/* Filters */}
          <HStack spacing={4} wrap="wrap">
            <InputGroup maxW="300px">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="콘텐츠 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            
            <Select
              placeholder="모든 타입"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              maxW="200px"
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
              maxW="200px"
            >
              <option value="published">발행됨</option>
              <option value="draft">임시저장</option>
              <option value="scheduled">예약됨</option>
              <option value="archived">보관됨</option>
            </Select>
            
            {(searchTerm || filterType !== 'all' || filterStatus !== 'all') && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchTerm('')
                  setFilterType('all')
                  setFilterStatus('all')
                }}
              >
                필터 초기화
              </Button>
            )}
          </HStack>

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
                {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                  ? '필터에 맞는 콘텐츠가 없습니다'
                  : '콘텐츠가 아직 없습니다'
                }
              </Heading>
              <Text color="gray.400" mb={6}>
                {searchTerm || filterType !== 'all' || filterStatus !== 'all'
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
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {filteredContents.map((content) => (
                  <ContentCard
                    key={content.id}
                    content={content}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onSchedule={handleSchedule}
                    onView={handleView}
                  />
                ))}
              </SimpleGrid>
            </>
          )}
        </VStack>
      </Layout>
    </ProtectedRoute>
  )
}