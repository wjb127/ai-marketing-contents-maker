'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Schedule, ContentType, ContentTone } from '@/types'
import { useAuth } from './useAuth'

export function useSchedules() {
  const { user } = useAuth()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSchedules = useCallback(async () => {
    if (!user) {
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
    frequency: 'daily' | 'weekly' | 'monthly'
    time_of_day: string
    timezone: string
  }) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase
        .from('schedules')
        .insert({
          ...scheduleData,
          user_id: user.id,
          is_active: true
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating schedule:', error)
        throw error
      }

      setSchedules(prev => [data, ...prev])
      return data
    } catch (error: any) {
      console.error('Error creating schedule:', error)
      throw error
    }
  }

  const updateSchedule = async (scheduleId: string, updates: Partial<Schedule>) => {
    if (!user) throw new Error('User not authenticated')

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
    if (!user) throw new Error('User not authenticated')

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