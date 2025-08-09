'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Content, ContentType, ContentTone, ContentStatus } from '@/types'
import { useAuth } from './useAuth'


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

      // Supabase DB에서 콘텐츠 가져오기 (단일 데이터 소스)
      const { data: dbContents, error: dbError } = await supabase
        .from('contents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (dbError) {
        console.error('❌ Database error:', dbError)
        throw new Error(dbError.message)
      }

      console.log('📊 Found', (dbContents?.length || 0), 'contents in database')
      if (dbContents?.length) {
        console.log('✅ Database contents loaded successfully')
      }

      setContents(dbContents || [])
    } catch (error: any) {
      console.error('❌ Error fetching contents:', error)
      setError(error.message)
      setContents([])
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
      console.log('🗑️ Deleting content:', contentId)
      
      // DB에서 콘텐츠 삭제
      const { error: deleteError } = await supabase
        .from('contents')
        .delete()
        .eq('id', contentId)
        .eq('user_id', user.id) // 보안을 위해 user_id도 확인

      if (deleteError) {
        console.error('❌ Database delete error:', deleteError)
        throw new Error(deleteError.message)
      }

      console.log('✅ Content deleted from database')
      
      // 로컬 상태에서도 제거
      setContents(prev => prev.filter(content => content.id !== contentId))
    } catch (error: any) {
      console.error('❌ Error deleting content:', error)
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
    tags?: string[]
    word_count?: number
    estimated_read_time?: number
  }) => {
    if (!user) throw new Error('User not authenticated')

    try {
      console.log('💾 Saving content to database')
      
      // DB에 콘텐츠 저장
      const { data: newContent, error: saveError } = await supabase
        .from('contents')
        .insert({
          user_id: user.id,
          title: contentData.title || `${contentData.topic} - ${new Date().toLocaleDateString('ko-KR')}`,
          content: contentData.content,
          content_type: contentData.content_type,
          tone: contentData.tone,
          status: (contentData.status as ContentStatus) || 'draft',
          topic: contentData.topic
        })
        .select()
        .single()

      if (saveError) {
        console.error('❌ Database save error:', saveError)
        throw new Error(saveError.message)
      }

      console.log('✅ Content saved to database:', newContent.id)
      
      // 로컬 상태 업데이트
      setContents(prev => [newContent, ...prev])
      
      return newContent
    } catch (error: any) {
      console.error('❌ Error saving content:', error)
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


      return finalUpdates
    } catch (error: any) {
      console.error('❌ Error updating content:', error)
      throw error
    }
  }

  const fetchContent = async (contentId: string): Promise<Content | null> => {
    try {
      console.log('🔍 Fetching single content:', contentId)
      
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