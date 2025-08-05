import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { anthropic } from '@/lib/claude'
import { getScheduledPromptTemplate } from '@/utils/prompt-templates'
import { calculateNextRun, scheduleContentGeneration } from '@/lib/qstash'

// 스케줄 즉시 실행 (테스트용)
export async function POST(request: NextRequest) {
  try {
    const { scheduleId } = await request.json()

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 스케줄 정보 조회
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', scheduleId)
      .single()

    if (scheduleError || !schedule) {
      console.error('Schedule not found:', scheduleError)
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    // 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', schedule.user_id)
      .single()

    if (userError || !user) {
      console.error('User not found:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // AI로 콘텐츠 생성
    let prompt
    
    // 설정에서 프롬프트 타입 확인
    const promptSettings = schedule.settings || {}
    
    if (promptSettings.promptType === 'custom' && promptSettings.customPrompt) {
      // 커스텀 프롬프트 사용
      prompt = promptSettings.customPrompt
    } else {
      // 자동 프롬프트 사용
      const randomTopic = schedule.topics[Math.floor(Math.random() * schedule.topics.length)]
      prompt = getScheduledPromptTemplate(
        schedule.content_type,
        schedule.tone,
        randomTopic,
        schedule.target_audience,
        schedule.additional_instructions
      )
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const generatedContent = message.content[0]?.type === 'text' 
      ? message.content[0].text 
      : ''

    // 콘텐츠 저장
    const { data: savedContent, error: contentError } = await supabase
      .from('contents')
      .insert({
        user_id: schedule.user_id,
        title: `${schedule.name} - 테스트 실행`,
        content_type: schedule.content_type,
        tone: schedule.tone,
        topic: schedule.topics?.[0] || '',
        content: generatedContent,
        status: 'draft',
        schedule_id: scheduleId,
        auto_generated: true
      })
      .select()
      .single()

    if (contentError || !savedContent) {
      console.error('Failed to save content:', contentError)
      throw contentError
    }

    // 스케줄 통계 업데이트
    await supabase
      .from('schedules')
      .update({ 
        total_generated: (schedule.total_generated || 0) + 1,
        last_run_at: new Date().toISOString()
      })
      .eq('id', scheduleId)

    return NextResponse.json({
      success: true,
      message: '콘텐츠가 성공적으로 생성되었습니다.',
      content: savedContent,
      schedule: {
        id: schedule.id,
        name: schedule.name,
        total_generated: (schedule.total_generated || 0) + 1
      }
    })

  } catch (error) {
    console.error('Error running scheduled content generation:', error)
    return NextResponse.json(
      { error: 'Failed to run scheduled generation', details: error.message },
      { status: 500 }
    )
  }
}

