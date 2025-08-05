import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

let supabaseClient: any = null

export function createClientComponentClient() {
  // Only create client on the browser side
  if (typeof window === 'undefined') {
    return null
  }

  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // DOGFOODING MODE: Return mock client if env vars are missing
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('DOGFOODING MODE: Missing Supabase environment variables, using mock client')
    supabaseClient = {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => Promise.resolve({ data: null, error: null }),
        delete: () => Promise.resolve({ data: null, error: null }),
      })
    }
    return supabaseClient
  }

  supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return supabaseClient
}

export function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase admin environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}