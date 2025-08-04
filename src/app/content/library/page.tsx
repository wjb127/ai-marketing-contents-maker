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
        title: 'Content Deleted',
        description: 'The content has been deleted successfully.',
        status: 'success',
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete the content. Please try again.',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleEdit = (content: Content) => {
    // Here you would navigate to an edit page or open an edit modal
    toast({
      title: 'Edit Feature',
      description: 'Edit functionality will be available soon!',
      status: 'info',
      duration: 3000,
    })
  }

  const handleSchedule = (content: Content) => {
    // Here you would open a scheduling modal
    toast({
      title: 'Schedule Feature',
      description: 'Scheduling functionality will be available soon!',
      status: 'info',
      duration: 3000,
    })
  }

  const handleView = (content: Content) => {
    // Here you would navigate to a detailed view
    toast({
      title: 'View Content',
      description: 'Detailed view will be available soon!',
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
              <Heading size="xl" mb={2}>
                Content Library
              </Heading>
              <Text color="gray.600">
                Manage all your generated content in one place
              </Text>
              <HStack spacing={4} mt={2} fontSize="sm" color="gray.500">
                <Text>Total: {stats.total}</Text>
                <Text>Published: {stats.published}</Text>
                <Text>Drafts: {stats.draft}</Text>
                <Text>Scheduled: {stats.scheduled}</Text>
                <Text>Auto-generated: {stats.auto_generated}</Text>
              </HStack>
            </Box>
            <Spacer />
            <Button
              leftIcon={<AddIcon />}
              colorScheme="brand"
              onClick={() => router.push('/content/create')}
              size={{ base: 'md', md: 'lg' }}
            >
              Create Content
            </Button>
          </Flex>

          {/* Filters */}
          <HStack spacing={4} wrap="wrap">
            <InputGroup maxW="300px">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            
            <Select
              placeholder="All Types"
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
              placeholder="All Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              maxW="200px"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="archived">Archived</option>
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
                Clear Filters
              </Button>
            )}
          </HStack>

          {/* Content Grid */}
          {loading ? (
            <Box py={20}>
              <LoadingSpinner text="Loading your content..." />
            </Box>
          ) : error ? (
            <Box textAlign="center" py={20}>
              <Heading size="md" mb={4} color="red.500">
                Error Loading Content
              </Heading>
              <Text color="gray.400" mb={6}>
                {error}
              </Text>
              <Button
                colorScheme="brand"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </Box>
          ) : filteredContents.length === 0 ? (
            <Box textAlign="center" py={20}>
              <Heading size="md" mb={4} color="gray.500">
                {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                  ? 'No content matches your filters'
                  : 'No content yet'
                }
              </Heading>
              <Text color="gray.400" mb={6}>
                {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search terms or filters'
                  : 'Start creating content to see it here'
                }
              </Text>
              <Button
                leftIcon={<AddIcon />}
                colorScheme="brand"
                onClick={() => router.push('/content/create')}
              >
                Create Your First Content
              </Button>
            </Box>
          ) : (
            <>
              <Text fontSize="sm" color="gray.600">
                Showing {filteredContents.length} of {contents.length} content pieces
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