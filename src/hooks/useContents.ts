'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Content, ContentType, ContentTone } from '@/types'
import { useAuth } from './useAuth'

export function useContents() {
  const { user } = useAuth()
  const [contents, setContents] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()

  const fetchContents = useCallback(async () => {
    if (!user || !supabase) {
      setContents([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('contents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching contents:', error)
        setError(error.message)
        return
      }

      setContents(data || [])
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
    if (!user || !supabase) throw new Error('User not authenticated or Supabase not initialized')

    try {
      const { error } = await supabase
        .from('contents')
        .delete()
        .eq('id', contentId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error deleting content:', error)
        throw error
      }

      setContents(prev => prev.filter(content => content.id !== contentId))
    } catch (error: any) {
      console.error('Error deleting content:', error)
      throw error
    }
  }

  const updateContent = async (contentId: string, updates: Partial<Content>) => {
    if (!user || !supabase) throw new Error('User not authenticated or Supabase not initialized')

    try {
      const { data, error } = await supabase
        .from('contents')
        .update(updates)
        .eq('id', contentId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating content:', error)
        throw error
      }

      setContents(prev => 
        prev.map(content => 
          content.id === contentId ? { ...content, ...data } : content
        )
      )

      return data
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