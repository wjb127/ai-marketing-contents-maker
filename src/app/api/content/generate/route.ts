import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { anthropic } from '@/lib/claude'
import { ContentType, ContentTone } from '@/types'
import { CONTENT_TYPE_SPECS } from '@/utils/constants'

const getPromptTemplate = (
  contentType: ContentType,
  tone: ContentTone,
  topic: string,
  length: string,
  targetAudience?: string,
  includeHashtags?: boolean,
  additionalNotes?: string
) => {
  const spec = CONTENT_TYPE_SPECS[contentType]
  
  let basePrompt = ''
  
  switch (contentType) {
    case 'thread':
      basePrompt = `Create a Twitter thread about "${topic}" in a ${tone} tone. 
      
      Format as a numbered thread (1/X, 2/X, etc.) with each tweet being engaging and connected to the next.
      - Start with a hook in the first tweet
      - Develop the topic across 5-8 tweets
      - End with a call-to-action or summary
      - Each tweet should be under 280 characters
      - Make it ${length === 'short' ? 'concise (5 tweets)' : length === 'medium' ? 'medium length (6-7 tweets)' : 'comprehensive (8-10 tweets)'}`
      break
      
    case 'x_post':
      basePrompt = `Create a single X (Twitter) post about "${topic}" in a ${tone} tone.
      
      - Keep it under 280 characters
      - Make it engaging and shareable
      - ${length === 'short' ? 'Be very concise' : length === 'medium' ? 'Use moderate detail' : 'Use full character limit effectively'}`
      break
      
    case 'blog_post':
      basePrompt = `Write a blog post about "${topic}" in a ${tone} tone.
      
      Structure:
      - Compelling title
      - Introduction hook
      - 3-5 main sections with subheadings
      - Conclusion with key takeaways
      - ${length === 'short' ? 'Keep it concise (500-800 words)' : length === 'medium' ? 'Medium length (800-1200 words)' : 'Comprehensive (1200-1500 words)'}`
      break
      
    case 'youtube_script':
      basePrompt = `Create a YouTube video script about "${topic}" in a ${tone} tone.
      
      Structure:
      - Hook (first 15 seconds)
      - Introduction and preview
      - Main content with engaging transitions
      - Call-to-action for likes/subscribe
      - Outro
      - ${length === 'short' ? 'Short video (3-5 minutes)' : length === 'medium' ? 'Medium video (5-8 minutes)' : 'Long video (8-12 minutes)'}
      - Include timing cues like [0:30] for key moments`
      break
      
    case 'instagram_reel_script':
      basePrompt = `Create an Instagram Reel script about "${topic}" in a ${tone} tone.
      
      - 15-60 second format
      - Include visual cues and text overlays
      - Hook within first 3 seconds
      - Engaging transitions
      - Strong call-to-action
      - ${length === 'short' ? '15-30 seconds' : length === 'medium' ? '30-45 seconds' : '45-60 seconds'}`
      break
      
    case 'linkedin_post':
      basePrompt = `Create a LinkedIn post about "${topic}" in a ${tone} tone.
      
      - Professional and valuable content
      - Start with a compelling statement
      - Use line breaks for readability
      - End with a question or call-to-action
      - ${length === 'short' ? 'Concise and punchy' : length === 'medium' ? 'Moderate detail with insights' : 'Comprehensive with examples and insights'}`
      break
      
    case 'facebook_post':
      basePrompt = `Create a Facebook post about "${topic}" in a ${tone} tone.
      
      - Engaging and conversational
      - Encourage comments and shares
      - Use storytelling if appropriate
      - ${length === 'short' ? 'Brief and catchy' : length === 'medium' ? 'Moderate detail with engagement' : 'Detailed with strong storytelling'}`
      break
  }
  
  if (targetAudience) {
    basePrompt += `\n- Target audience: ${targetAudience}`
  }
  
  if (includeHashtags && spec.recommendedHashtags > 0) {
    basePrompt += `\n- Include ${spec.recommendedHashtags} relevant hashtags`
  }
  
  if (additionalNotes) {
    basePrompt += `\n- Additional requirements: ${additionalNotes}`
  }
  
  basePrompt += `\n\nReturn only the content without additional explanations or meta-commentary.`
  
  return basePrompt
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // DOGFOODING MODE: Skip auth check
    const user = { id: '00000000-0000-0000-0000-000000000001' }

    const { 
      type,
      topic, 
      tone, 
      target_audience,
      additional_instructions
    } = await request.json()

    if (!topic || !type || !tone) {
      return NextResponse.json(
        { error: 'Type, topic, and tone are required' },
        { status: 400 }
      )
    }

    // DOGFOODING MODE: Skip subscription checks
    const monthlyCount = 0

    const prompt = getPromptTemplate(
      type,
      tone,
      topic,
      'medium', // default length
      target_audience,
      true, // include hashtags by default
      additional_instructions
    )

    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const generatedContent = message.content[0]?.type === 'text' ? message.content[0].text : ''
    
    // Save content to database
    const { data: contentData, error: contentError } = await supabase
      .from('contents')
      .insert({
        user_id: user.id,
        type,
        tone,
        topic,
        content: generatedContent,
        target_audience,
        additional_instructions,
        status: 'draft'
      })
      .select()
      .single()

    if (contentError) {
      console.error('Error saving content:', contentError)
      return NextResponse.json(
        { error: 'Failed to save generated content' },
        { status: 500 }
      )
    }

    // DOGFOODING MODE: Skip updating user's monthly content count

    return NextResponse.json(contentData)
  } catch (error) {
    console.error('Error generating content:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}