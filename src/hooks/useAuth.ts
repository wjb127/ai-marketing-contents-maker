'use client'

// DOGFOODING MODE: Returns hardcoded user
import { User } from '@supabase/supabase-js'

const DOGFOODING_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'dogfooding@test.com',
  app_metadata: {},
  user_metadata: {
    name: 'Dogfooding User',
    subscription_plan: 'premium'
  },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  phone: null,
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  role: 'authenticated',
  email_confirmed_at: new Date().toISOString(),
  phone_confirmed_at: null
}

export function useAuth() {
  return {
    user: DOGFOODING_USER,
    loading: false,
    signIn: async () => {},
    signUp: async () => {},
    signOut: async () => {}
  }
}