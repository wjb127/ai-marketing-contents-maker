'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Schedule, ContentType, ContentTone } from '@/types'
import { useAuth } from './useAuth'

export function useSchedules() {
  const { user } = useAuth()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()

  const fetchSchedules = useCallback(async () => {
    if (!user || !supabase) {
      setSchedules([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching schedules:', error)
        setError(error.message)
        return
      }

      setSchedules(data || [])
    } catch (error: any) {
      console.error('Error fetching schedules:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  const createSchedule = async (scheduleData: {
    name: string
    content_type: ContentType
    content_tone: ContentTone
    topic: string
    target_audience?: string
    additional_instructions?: string
    frequency: 'hourly' | '3hours' | '6hours' | 'daily' | 'weekly' | 'monthly'
    time_of_day: string
    timezone: string
    settings?: any
  }) => {
    if (!user) throw new Error('User not authenticated')

    try {
      console.log('Creating schedule with data:', scheduleData)
      
      // API를 통해 스케줄 생성 (QStash 예약 포함)
      const response = await fetch('/api/schedule/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleData),
      })

      console.log('Schedule create response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
        console.error('Schedule creation failed:', errorData)
        throw new Error(errorData.error || `Failed to create schedule (${response.status})`)
      }

      const data = await response.json()
      console.log('Schedule created successfully:', data)
      setSchedules(prev => [data, ...prev])
      return data
    } catch (error: any) {
      console.error('Error creating schedule:', error)
      throw error
    }
  }

  const updateSchedule = async (scheduleId: string, updates: Partial<Schedule>) => {
    if (!user || !supabase) throw new Error('User not authenticated or Supabase not initialized')

    try {
      const { data, error } = await supabase
        .from('schedules')
        .update(updates)
        .eq('id', scheduleId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating schedule:', error)
        throw error
      }

      setSchedules(prev => 
        prev.map(schedule => 
          schedule.id === scheduleId ? { ...schedule, ...data } : schedule
        )
      )

      return data
    } catch (error: any) {
      console.error('Error updating schedule:', error)
      throw error
    }
  }

  const deleteSchedule = async (scheduleId: string) => {
    if (!user || !supabase) throw new Error('User not authenticated or Supabase not initialized')

    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', scheduleId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error deleting schedule:', error)
        throw error
      }

      setSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId))
    } catch (error: any) {
      console.error('Error deleting schedule:', error)
      throw error
    }
  }

  const toggleSchedule = async (scheduleId: string, isActive: boolean) => {
    return updateSchedule(scheduleId, { is_active: isActive })
  }

  return {
    schedules,
    loading,
    error,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleSchedule,
    refetch: fetchSchedules
  }
}