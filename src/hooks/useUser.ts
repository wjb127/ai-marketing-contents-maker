'use client'

// DOGFOODING MODE: Returns hardcoded user data
import { User } from '@/types'

const DOGFOODING_USER_DATA: User = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'dogfooding@test.com',
  name: 'Dogfooding User',
  avatar_url: null,
  subscription_plan: 'premium',
  subscription_status: 'active',
  subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
  toss_customer_id: null,
  monthly_content_count: 0,
  monthly_reset_date: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

export function useUser() {
  return {
    user: DOGFOODING_USER_DATA,
    loading: false,
    error: null,
    refetch: async () => {},
    updateUser: async (updates: Partial<User>) => {
      // In dogfooding mode, just return the updated user
      return { ...DOGFOODING_USER_DATA, ...updates }
    }
  }
}