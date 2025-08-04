import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface ContentGenerationRequest {
  topic: string
  platform: 'twitter' | 'instagram' | 'linkedin' | 'facebook'
  tone: 'professional' | 'casual' | 'humorous' | 'inspirational'
  length: 'short' | 'medium' | 'long'
}