import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { ContentType, ContentTone, ContentStatus } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // DOGFOODING MODE: Skip auth check
    const user = { id: '00000000-0000-0000-0000-000000000001' }

    const { content, prompt, status = 'draft' } = await request.json()

    if (!content || !prompt) {
      return NextResponse.json(
        { error: 'Content and prompt are required' },
        { status: 400 }
      )
    }

    // Save content to database (ultra simple)
    const { data: contentData, error: contentError } = await supabase
      .from('contents')
      .insert({
        user_id: user.id,
        content,
        prompt,
        status
      })
      .select()
      .single()

    if (contentError) {
      console.error('Error saving content:', contentError)
      return NextResponse.json(
        { error: 'Failed to save content' },
        { status: 500 }
      )
    }

    return NextResponse.json(contentData)
  } catch (error) {
    console.error('Error saving content:', error)
    return NextResponse.json(
      { error: 'Failed to save content' },
      { status: 500 }
    )
  }
}