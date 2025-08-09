import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { anthropic } from '@/lib/claude'
import { ContentType, ContentTone } from '@/types'
import { CONTENT_TYPE_SPECS, CREATIVITY_LEVELS } from '@/utils/constants'
import { getDatabasePromptTemplate, logPromptUsage } from '@/utils/db-prompt-templates'
import { evaluateAndSaveContent } from '@/lib/evaluation'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // DOGFOODING MODE: Skip auth check
    const user = { id: '00000000-0000-0000-0000-000000000001' }

    const requestData = await request.json()
    
    // Bundle all parameters into a single prompt string  
    const prompt = Object.entries(requestData)
      .filter(([key, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')

    // DOGFOODING MODE: Skip subscription checks
    const monthlyCount = 0

    console.log('🤖 Generating content with simple prompt')
    
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: `Create content based on these parameters:\n\n${prompt}\n\nGenerate high-quality content according to the specified requirements.`
        }
      ]
    })

    const generatedContent = message.content[0]?.type === 'text' ? message.content[0].text : ''
    
    console.log('✅ Content generated successfully')
    
    // Save content to database (ultra simple)
    const { data: contentData, error: contentError } = await supabase
      .from('contents')
      .insert({
        user_id: user.id,
        content: generatedContent,
        prompt: prompt,
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