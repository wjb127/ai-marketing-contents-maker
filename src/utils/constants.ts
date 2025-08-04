export const CONTENT_TYPES = {
  THREAD: 'thread',
  X_POST: 'x_post',
  BLOG_POST: 'blog_post',
  YOUTUBE_SCRIPT: 'youtube_script',
  INSTAGRAM_REEL_SCRIPT: 'instagram_reel_script',
  LINKEDIN_POST: 'linkedin_post',
  FACEBOOK_POST: 'facebook_post',
} as const

export const CONTENT_TYPE_LABELS = {
  [CONTENT_TYPES.THREAD]: 'Thread',
  [CONTENT_TYPES.X_POST]: 'X Post',
  [CONTENT_TYPES.BLOG_POST]: 'Blog Post',
  [CONTENT_TYPES.YOUTUBE_SCRIPT]: 'YouTube Script',
  [CONTENT_TYPES.INSTAGRAM_REEL_SCRIPT]: 'Instagram Reel Script',
  [CONTENT_TYPES.LINKEDIN_POST]: 'LinkedIn Post',
  [CONTENT_TYPES.FACEBOOK_POST]: 'Facebook Post',
} as const

export const TONES = {
  PROFESSIONAL: 'professional',
  CASUAL: 'casual',
  HUMOROUS: 'humorous',
  INSPIRATIONAL: 'inspirational',
  EDUCATIONAL: 'educational',
  MOTIVATIONAL: 'motivational',
} as const

export const TONE_LABELS = {
  [TONES.PROFESSIONAL]: 'Professional',
  [TONES.CASUAL]: 'Casual',
  [TONES.HUMOROUS]: 'Humorous',
  [TONES.INSPIRATIONAL]: 'Inspirational',
  [TONES.EDUCATIONAL]: 'Educational',
  [TONES.MOTIVATIONAL]: 'Motivational',
} as const

export const CONTENT_LENGTHS = {
  SHORT: 'short',
  MEDIUM: 'medium',
  LONG: 'long',
} as const

export const CONTENT_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const

export const SCHEDULE_FREQUENCY = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  BI_WEEKLY: 'bi_weekly',
  MONTHLY: 'monthly',
} as const

export const FREQUENCY_LABELS = {
  [SCHEDULE_FREQUENCY.DAILY]: 'Daily',
  [SCHEDULE_FREQUENCY.WEEKLY]: 'Weekly',
  [SCHEDULE_FREQUENCY.BI_WEEKLY]: 'Bi-weekly',
  [SCHEDULE_FREQUENCY.MONTHLY]: 'Monthly',
} as const

export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  PRO: 'pro',
  PREMIUM: 'premium',
} as const

export const PLAN_LIMITS = {
  [SUBSCRIPTION_PLANS.FREE]: {
    maxSchedules: 1,
    maxContentPerMonth: 10,
    autoGeneration: false,
    contentTypes: [CONTENT_TYPES.X_POST, CONTENT_TYPES.LINKEDIN_POST],
  },
  [SUBSCRIPTION_PLANS.PRO]: {
    maxSchedules: 5,
    maxContentPerMonth: 100,
    autoGeneration: true,
    contentTypes: Object.values(CONTENT_TYPES),
  },
  [SUBSCRIPTION_PLANS.PREMIUM]: {
    maxSchedules: -1, // unlimited
    maxContentPerMonth: -1, // unlimited
    autoGeneration: true,
    contentTypes: Object.values(CONTENT_TYPES),
  },
} as const

export const CONTENT_TYPE_SPECS = {
  [CONTENT_TYPES.THREAD]: {
    maxLength: 2800, // 10 tweets * 280 chars
    recommendedHashtags: 2,
    structure: 'numbered_tweets',
    description: 'Twitter thread with multiple connected tweets',
  },
  [CONTENT_TYPES.X_POST]: {
    maxLength: 280,
    recommendedHashtags: 2,
    structure: 'single_post',
    description: 'Single X (Twitter) post',
  },
  [CONTENT_TYPES.BLOG_POST]: {
    maxLength: 2000,
    recommendedHashtags: 5,
    structure: 'article',
    description: 'Blog article with title and sections',
  },
  [CONTENT_TYPES.YOUTUBE_SCRIPT]: {
    maxLength: 3000,
    recommendedHashtags: 0,
    structure: 'script',
    description: 'YouTube video script with intro, main content, and outro',
  },
  [CONTENT_TYPES.INSTAGRAM_REEL_SCRIPT]: {
    maxLength: 500,
    recommendedHashtags: 8,
    structure: 'short_script',
    description: 'Short script for Instagram Reel (15-60 seconds)',
  },
  [CONTENT_TYPES.LINKEDIN_POST]: {
    maxLength: 3000,
    recommendedHashtags: 5,
    structure: 'professional_post',
    description: 'Professional LinkedIn post',
  },
  [CONTENT_TYPES.FACEBOOK_POST]: {
    maxLength: 2000,
    recommendedHashtags: 3,
    structure: 'social_post',
    description: 'Facebook social media post',
  },
} as const