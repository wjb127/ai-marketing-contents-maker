'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Content, ContentType, ContentTone } from '@/types'
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

      // DOGFOODING MODE: Use mock data instead of Supabase
      console.log('DOGFOODING MODE: Using mock data')
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setContents(MOCK_CONTENTS)
    } catch (error: any) {
      console.error('Error fetching contents:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchContents()
  }, [fetchContents])

  const createContent = async (contentData: {
    type: ContentType
    tone: ContentTone
    topic: string
    target_audience?: string
    additional_instructions?: string
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
      // DOGFOODING MODE: Mock delete operation
      console.log('DOGFOODING MODE: Mock delete content', contentId)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setContents(prev => prev.filter(content => content.id !== contentId))
    } catch (error: any) {
      console.error('Error deleting content:', error)
      throw error
    }
  }

  const updateContent = async (contentId: string, updates: Partial<Content>) => {
    if (!user) throw new Error('User not authenticated')

    try {
      // DOGFOODING MODE: Mock update operation
      console.log('DOGFOODING MODE: Mock update content', contentId, updates)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const updatedContent = { 
        ...updates, 
        updated_at: new Date().toISOString() 
      }
      
      setContents(prev => 
        prev.map(content => 
          content.id === contentId ? { ...content, ...updatedContent } : content
        )
      )

      return updatedContent
    } catch (error: any) {
      console.error('Error updating content:', error)
      throw error
    }
  }

  return {
    contents,
    loading,
    error,
    createContent,
    deleteContent,
    updateContent,
    refetch: fetchContents
  }
}