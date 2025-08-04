export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  subscription_plan: 'free' | 'pro' | 'premium'
  subscription_status: 'active' | 'canceled' | 'expired'
  created_at: string
  updated_at: string
}

export type ContentType = 
  | 'thread' 
  | 'x_post' 
  | 'blog_post' 
  | 'youtube_script' 
  | 'instagram_reel_script'
  | 'linkedin_post'
  | 'facebook_post'

export type ContentTone = 
  | 'professional' 
  | 'casual' 
  | 'humorous' 
  | 'inspirational'
  | 'educational'
  | 'motivational'

export type ContentStatus = 'draft' | 'scheduled' | 'published' | 'archived'

export interface Content {
  id: string
  user_id: string
  title: string
  content: string
  content_type: ContentType
  tone: ContentTone
  status: ContentStatus
  topic: string
  tags: string[]
  word_count?: number
  estimated_read_time?: number
  scheduled_at?: string
  published_at?: string
  auto_generated: boolean
  schedule_id?: string
  metadata?: {
    video_duration?: string
    hashtags?: string[]
    target_audience?: string
    seo_keywords?: string[]
  }
  created_at: string
  updated_at: string
}

export interface Schedule {
  id: string
  user_id: string
  name: string
  content_type: ContentType
  frequency: 'daily' | 'weekly' | 'bi_weekly' | 'monthly'
  time: string
  timezone: string
  topics: string[]
  tone: ContentTone
  is_active: boolean
  next_run_at?: string
  last_run_at?: string
  total_generated: number
  settings: {
    auto_publish: boolean
    max_per_day?: number
    target_audience?: string
    include_hashtags: boolean
    content_length: 'short' | 'medium' | 'long'
  }
  created_at: string
  updated_at: string
}

export interface ContentTemplate {
  id: string
  name: string
  content_type: ContentType
  template: string
  variables: string[]
  description: string
  is_premium: boolean
  created_at: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  features: string[]
  max_schedules: number
  max_content_per_month: number
  auto_generation: boolean
  priority_support: boolean
}