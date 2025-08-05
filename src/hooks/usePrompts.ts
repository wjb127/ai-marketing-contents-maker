'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface PromptTemplate {
  id: string
  user_id?: string
  name: string
  topic: string
  content_type: string
  tone: string
  target_audience: string
  additional_instructions: string
  prompt_type: 'auto' | 'custom'
  custom_prompt?: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export function usePrompts() {
  const { user } = useAuth()
  const [prompts, setPrompts] = useState<PromptTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()

  const fetchPrompts = useCallback(async () => {
    // 일단 유저 연결 없이 모든 프롬프트 조회 (나중에 확장 가능)
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching prompts from Supabase...')

      const { data, error } = await supabase
        .from('prompt_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching prompts:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        setError(error.message)
        return
      }

      console.log('Fetched prompts:', data)
      setPrompts(data || [])
    } catch (error: any) {
      console.error('Error fetching prompts:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchPrompts()
  }, [fetchPrompts])

  const createPrompt = async (promptData: Omit<PromptTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('Creating prompt with data:', promptData)
      console.log('User ID:', user?.id)
      console.log('User object:', user)
      
      // 도그푸딩용: 임시 사용자 ID 사용 (실제 사용자가 없을 경우)
      const userId = user?.id || '00000000-0000-0000-0000-000000000001' // 도그푸딩용 임시 UUID
      
      const insertData = {
        ...promptData,
        user_id: userId
      }
      
      console.log('Insert data:', insertData)

      const { data, error } = await supabase
        .from('prompt_templates')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          full: error
        })
        throw new Error(`Supabase error: ${error.message || JSON.stringify(error)}`)
      }

      console.log('Prompt created successfully:', data)
      setPrompts(prev => [data, ...prev])
      return data
    } catch (error: any) {
      console.error('Error creating prompt:', error)
      throw error
    }
  }

  const updatePrompt = async (promptId: string, updates: Partial<PromptTemplate>) => {
    try {
      const { data, error } = await supabase
        .from('prompt_templates')
        .update(updates)
        .eq('id', promptId)
        .select()
        .single()

      if (error) {
        console.error('Error updating prompt:', error)
        throw error
      }

      setPrompts(prev => 
        prev.map(prompt => 
          prompt.id === promptId ? { ...prompt, ...data } : prompt
        )
      )

      return data
    } catch (error: any) {
      console.error('Error updating prompt:', error)
      throw error
    }
  }

  const deletePrompt = async (promptId: string) => {
    try {
      // 실제 삭제 대신 is_active를 false로 설정 (소프트 삭제)
      const { error } = await supabase
        .from('prompt_templates')
        .update({ is_active: false })
        .eq('id', promptId)

      if (error) {
        console.error('Error deleting prompt:', error)
        throw error
      }

      setPrompts(prev => prev.filter(prompt => prompt.id !== promptId))
    } catch (error: any) {
      console.error('Error deleting prompt:', error)
      throw error
    }
  }

  // localStorage에서 기존 프롬프트를 마이그레이션하는 함수
  const migrateFromLocalStorage = async () => {
    try {
      console.log('Starting migration from localStorage...')
      const savedPrompts = localStorage.getItem('promptTemplates')
      if (!savedPrompts) {
        console.log('No localStorage data found')
        return
      }

      const localPrompts = JSON.parse(savedPrompts) as any[]
      console.log('Found localStorage prompts:', localPrompts)
      
      for (const localPrompt of localPrompts) {
        console.log('Processing prompt:', localPrompt)
        
        // 이미 DB에 있는지 확인 (name으로 중복 체크)
        const { data: existing } = await supabase
          .from('prompt_templates')
          .select('id')
          .eq('name', localPrompt.name)
          .eq('is_active', true)
          .maybeSingle() // single() 대신 maybeSingle() 사용

        if (!existing) {
          console.log('Creating new prompt from localStorage data')
          await createPrompt({
            name: localPrompt.name,
            topic: localPrompt.topic || '',
            content_type: localPrompt.contentType,
            tone: localPrompt.tone,
            target_audience: localPrompt.targetAudience || '',
            additional_instructions: localPrompt.additionalInstructions || '',
            prompt_type: localPrompt.promptType || 'auto',
            custom_prompt: localPrompt.customPrompt || '',
            is_active: true
          })
        } else {
          console.log('Prompt already exists in DB, skipping')
        }
      }

      // 마이그레이션 완료 후 localStorage 데이터 백업용으로 변경
      localStorage.setItem('promptTemplates_migrated', savedPrompts)
      localStorage.removeItem('promptTemplates')
      console.log('Migration completed successfully')
      
      // 최신 데이터 다시 가져오기
      await fetchPrompts()
    } catch (error) {
      console.error('Error migrating from localStorage:', error)
    }
  }

  return {
    prompts,
    loading,
    error,
    createPrompt,
    updatePrompt,
    deletePrompt,
    refetch: fetchPrompts,
    migrateFromLocalStorage
  }
}