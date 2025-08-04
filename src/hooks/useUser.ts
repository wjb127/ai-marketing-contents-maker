'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '@/lib/supabase'
import { User } from '@/types'

export function useUser() {
  const { user: authUser } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authUser) {
      setUser(null)
      setLoading(false)
      return
    }

    fetchUser()
  }, [authUser])

  const fetchUser = async () => {
    if (!authUser) return

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) {
        console.error('Error fetching user:', error)
        setError(error.message)
        return
      }

      setUser(data)
    } catch (error: any) {
      console.error('Error fetching user:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (updates: Partial<User>) => {
    if (!authUser) return

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', authUser.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating user:', error)
        throw error
      }

      setUser(data)
      return data
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  return {
    user,
    loading,
    error,
    refetch: fetchUser,
    updateUser
  }
}