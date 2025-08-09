import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { ContentType, ContentTone, ContentStatus } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // DOGFOODING MODE: Skip auth check
    const user = { id: '00000000-0000-0000-0000-000000000001' }

    const { 
      title,
      content,
      content_type,
      tone,
      topic,
      status = 'draft',
      target_audience,
      additional_instructions,
      tags = [],
      word_count,
      estimated_read_time
    } = await request.json()

    if (!content || !content_type || !tone || !topic) {
      return NextResponse.json(
        { error: 'Content, content_type, tone, and topic are required' },
        { status: 400 }
      )
    }

    // Generate title if not provided
    const contentTitle = title || `${topic} - ${new Date().toLocaleDateString('ko-KR')}`

    // Save content to database
    const { data: contentData, error: contentError } = await supabase
      .from('contents')
      .insert({
        user_id: user.id,
        title: contentTitle,
        content,
        content_type,
        tone,
        topic,
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