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
  | 'hook_empathy_solution'
  | 'before_after'
  | 'story_telling'
  | 'listicle'
  | 'hero_journey'
  | 'myth_buster'
  | 'comparison'
  | 'emotional_empathy'
  | 'provocative_question'
  | 'fact_bombardment'

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
  // Evaluation fields
  ai_rating?: number
  ai_feedback?: string
  ai_evaluation_criteria?: ContentEvaluationCriteria
  evaluated_at?: string
  evaluation_model?: string
  created_at: string
  updated_at: string
}

export interface ContentEvaluationCriteria {
  relevance?: number     // 1-5: 주제와의 관련성
  quality?: number       // 1-5: 콘텐츠 품질
  engagement?: number    // 1-5: 참여도 예상
  creativity?: number    // 1-5: 창의성
  clarity?: number       // 1-5: 명확성
  tone_accuracy?: number // 1-5: 톤 정확성
}

export interface ContentEvaluationRequest {
  content_id: string
}

export interface ContentEvaluationResponse {
  rating: number
  feedback: string
  criteria: ContentEvaluationCriteria
  evaluation_model: string
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
  description: string
  features: string[]
  popular?: boolean
}