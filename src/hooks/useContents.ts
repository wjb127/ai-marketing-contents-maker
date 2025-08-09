'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Content, ContentType, ContentTone, ContentStatus } from '@/types'
import { useAuth } from './useAuth'

// DOGFOODING MODE: Mock data
const MOCK_CONTENTS: Content[] = [
  {
    id: '1',
    user_id: '00000000-0000-0000-0000-000000000001',
    title: 'AI의 미래와 마케팅',
    content: 'AI 기술이 마케팅 분야에 미치는 영향과 앞으로의 전망에 대해 알아보겠습니다. #AI #마케팅 #미래기술',
    content_type: 'x_post',
    tone: 'professional',
    status: 'published',
    topic: 'AI 마케팅',
    tags: ['AI', '마케팅', '기술'],
    word_count: 50,
    published_at: '2024-01-15T10:00:00Z',
    auto_generated: false,
    created_at: '2024-01-15T09:30:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    user_id: '00000000-0000-0000-0000-000000000001',
    title: '소셜미디어 마케팅 전략',
    content: '효과적인 소셜미디어 마케팅 전략을 수립하는 방법에 대해 알아보겠습니다...',
    content_type: 'blog_post',
    tone: 'educational',
    status: 'draft',
    topic: '소셜미디어 전략',
    tags: ['소셜미디어', '마케팅', '전략'],
    word_count: 1200,
    auto_generated: true,
    schedule_id: 'schedule-1',
    created_at: '2024-01-14T15:00:00Z',
    updated_at: '2024-01-14T15:00:00Z'
  },
  {
    id: '3',
    user_id: '00000000-0000-0000-0000-000000000001',
    title: 'LinkedIn 포스팅 팁',
    content: '전문적인 LinkedIn 포스트를 작성하는 10가지 팁을 공유합니다. 더 많은 참여를 이끌어내세요!',
    content_type: 'linkedin_post',
    tone: 'professional',
    status: 'scheduled',
    topic: 'LinkedIn 마케팅',
    tags: ['LinkedIn', '포스팅', '팁'],
    word_count: 300,
    scheduled_at: '2024-01-20T14:00:00Z',
    auto_generated: false,
    created_at: '2024-01-13T11:00:00Z',
    updated_at: '2024-01-13T11:00:00Z'
  }
]

export function useContents() {
  const { user } = useAuth()
  const [contents, setContents] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()

  const fetchContents = useCallback(async () => {
    if (!user) {
      setContents([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Fetching contents from database for user:', user.id)

      // 실제 DB에서 콘텐츠 가져오기
      const { data: dbContents, error: dbError } = await supabase
        .from('contents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (dbError) {
        console.error('❌ Database error:', dbError)
        // DB 에러가 있어도 localStorage와 mock 데이터는 보여주기
      }

      console.log('📊 Found', (dbContents?.length || 0), 'contents in database')
      if (dbContents?.length) {
        console.log('✅ Database contents:', JSON.stringify(dbContents.slice(0, 2), null, 2))
      }

      // Get saved contents from localStorage (이전 저장된 것들)
      const savedContents = localStorage.getItem('saved_contents')
      const userSavedContents = savedContents ? JSON.parse(savedContents) : []
      
      console.log('📱 Found', userSavedContents.length, 'contents in localStorage')

      // DB 데이터 우선, 그 다음 localStorage, 마지막으로 mock 데이터
      const allContents = [
        ...(dbContents || []),
        ...userSavedContents,
        ...MOCK_CONTENTS
      ]
      
      console.log('📋 Total contents loaded:', allContents.length)
      setContents(allContents)
    } catch (error: any) {
      console.error('❌ Error fetching contents:', error)
      setError(error.message)
      
      // 에러가 있어도 최소한 mock 데이터는 보여주기
      setContents(MOCK_CONTENTS)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    fetchContents()
  }, [fetchContents])

  const createContent = async (contentData: {
    type: ContentType
    tone: ContentTone
    topic: string
    target_audience?: string
    additional_instructions?: string
    creativityLevel?: string
    temperature?: number
    top_p?: number
  }) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contentData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate content')
      }

      const newContent = await response.json()
      setContents(prev => [newContent, ...prev])
      return newContent
    } catch (error: any) {
      console.error('Error creating content:', error)
      throw error
    }
  }

  const deleteContent = async (contentId: string) => {
    if (!user) throw new Error('User not authenticated')

    try {
      // DOGFOODING MODE: Delete from localStorage if it's a saved content
      console.log('DOGFOODING MODE: Delete content', contentId)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // If it's a saved content (starts with 'saved_'), remove from localStorage
      if (contentId.startsWith('saved_')) {
        const savedContents = localStorage.getItem('saved_contents')
        if (savedContents) {
          const userSavedContents = JSON.parse(savedContents)
          const updatedContents = userSavedContents.filter((content: Content) => content.id !== contentId)
          localStorage.setItem('saved_contents', JSON.stringify(updatedContents))
        }
      }
      
      setContents(prev => prev.filter(content => content.id !== contentId))
    } catch (error: any) {
      console.error('Error deleting content:', error)
      throw error
    }
  }

  const saveContent = async (contentData: {
    title?: string
    content: string
    content_type: ContentType
    tone: ContentTone
    topic: string
    status?: string
    target_audience?: string
    additional_instructions?: string
    tags?: string[]
    word_count?: number
    estimated_read_time?: number
  }) => {
    if (!user) throw new Error('User not authenticated')

    try {
      // Create a new content object with all required fields
      const newContent: Content = {
        id: `saved_${Date.now()}`,
        user_id: user.id,
        title: contentData.title || `${contentData.topic} - ${new Date().toLocaleDateString('ko-KR')}`,
        content: contentData.content,
        content_type: contentData.content_type,
        tone: contentData.tone,
        status: (contentData.status as ContentStatus) || 'draft',
        topic: contentData.topic,
        tags: contentData.tags || [],
        word_count: contentData.word_count || contentData.content.split(/\s+/).length,
        estimated_read_time: contentData.estimated_read_time || Math.ceil(contentData.content.split(/\s+/).length / 200),
        auto_generated: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: contentData.target_audience ? { target_audience: contentData.target_audience } : undefined
      }

      // Save to localStorage for demo purposes
      const savedContents = localStorage.getItem('saved_contents')
      const userSavedContents = savedContents ? JSON.parse(savedContents) : []
      userSavedContents.unshift(newContent)
      localStorage.setItem('saved_contents', JSON.stringify(userSavedContents))

      // Update local state
      setContents(prev => [newContent, ...prev])
      
      return newContent
    } catch (error: any) {
      console.error('Error saving content:', error)
      throw error
    }
  }

  const updateContent = async (contentId: string, updates: Partial<Content>) => {
    if (!user) throw new Error('User not authenticated')

    try {
      console.log('📝 Updating content:', contentId, updates)
      
      // 실제 DB 업데이트 시도
      const { data: updatedContent, error: dbError } = await supabase
        .from('contents')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', contentId)
        .eq('user_id', user.id) // 보안을 위해 user_id도 확인
        .select()
        .single()

      if (dbError) {
        console.error('❌ Database update error:', dbError)
        // DB 에러가 있어도 로컬 상태는 업데이트
      } else {
        console.log('✅ Content updated in database:', updatedContent)
      }

      // 로컬 상태 업데이트 (DB 성공 여부와 관계없이)
      const finalUpdates = { 
        ...updates, 
        updated_at: new Date().toISOString() 
      }
      
      setContents(prev => 
        prev.map(content => 
          content.id === contentId ? { ...content, ...finalUpdates } : content
        )
      )

      // localStorage에도 업데이트 (saved_ 접두사가 있는 경우)
      if (contentId.startsWith('saved_')) {
        const savedContents = localStorage.getItem('saved_contents')
        if (savedContents) {
          const userSavedContents = JSON.parse(savedContents)
          const updatedSavedContents = userSavedContents.map((content: Content) => 
            content.id === contentId ? { ...content, ...finalUpdates } : content
          )
          localStorage.setItem('saved_contents', JSON.stringify(updatedSavedContents))
          console.log('📱 Updated content in localStorage')
        }
      }

      return finalUpdates
    } catch (error: any) {
      console.error('❌ Error updating content:', error)
      throw error
    }
  }

  const fetchContent = async (contentId: string): Promise<Content | null> => {
    try {
      console.log('🔍 Fetching single content:', contentId)
      
      // DOGFOODING MODE: Mock 데이터에서 먼저 확인
      const mockContent = MOCK_CONTENTS.find(c => c.id === contentId)
      if (mockContent) {
        console.log('✅ Found in mock data:', mockContent.title)
        return mockContent
      }

      // Supabase에서 단일 콘텐츠 가져오기
      const { data, error } = await supabase
        .from('contents')
        .select('*')
        .eq('id', contentId)
        .single()

      if (error) {
        console.error('❌ Error fetching content from DB:', error)
        return null
      }

      console.log('✅ Found in database:', data.title || data.id)
      return data
    } catch (error) {
      console.error('❌ Error fetching content:', error)
      return null
    }
  }

  return {
    contents,
    loading,
    error,
    createContent,
    saveContent,
    deleteContent,
    updateContent,
    fetchContent,
    refetch: fetchContents
  }
}