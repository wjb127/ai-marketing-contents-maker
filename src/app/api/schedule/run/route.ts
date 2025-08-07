import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { anthropic } from '@/lib/claude'
import { getDatabasePromptTemplate, logPromptUsage } from '@/utils/db-prompt-templates'
import { calculateNextRun, scheduleContentGeneration } from '@/lib/qstash'
import { CREATIVITY_LEVELS } from '@/utils/constants'

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
    const startTime = Date.now()
    
    // 설정에서 프롬프트 타입 확인
    const promptSettings = schedule.settings || {}
    
    if (promptSettings.promptType === 'custom' && promptSettings.customPrompt) {
      // 커스텀 프롬프트 사용
      prompt = promptSettings.customPrompt
      console.log('🎯 Using custom prompt from schedule settings')
    } else {
      // 데이터베이스 프롬프트 사용
      const topic = schedule.topics?.[Math.floor(Math.random() * (schedule.topics?.length || 1))] || schedule.topic || ''
      prompt = await getDatabasePromptTemplate(
        schedule.content_type,
        schedule.tone || schedule.content_tone,
        topic,
        schedule.target_audience,
        schedule.additional_instructions
      )
      console.log('🗄️ Using database prompt template for scheduled generation')
    }
    
    const promptFetchTime = Date.now() - startTime

    // 창의성 설정 가져오기
    const creativitySettings = schedule.creativity_level 
      ? CREATIVITY_LEVELS[schedule.creativity_level as keyof typeof CREATIVITY_LEVELS]
      : CREATIVITY_LEVELS.balanced

    console.log('🤖 Generating scheduled content with database prompt')
    const generateStartTime = Date.now()
    
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: creativitySettings.temperature,
      top_p: creativitySettings.top_p,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const generateTime = Date.now() - generateStartTime
    const generatedContent = message.content[0]?.type === 'text' 
      ? message.content[0].text 
      : ''
      
    console.log('✅ Scheduled content generated successfully')

    // 콘텐츠 저장 (dogfooding 환경에 맞게 수정)
    const contentData: any = {
      user_id: schedule.user_id,
      title: schedule.name,
      content: generatedContent,
      content_type: schedule.content_type,  // content_type 컬럼만 사용
      tone: schedule.tone || schedule.content_tone || 'professional',
      topic: schedule.topics?.[0] || schedule.topic || '',
      status: 'draft',
      schedule_id: scheduleId
    }
    
    console.log('📝 Attempting to save content:', JSON.stringify(contentData, null, 2))
    
    const { data: savedContent, error: contentError } = await supabase
      .from('contents')
      .insert(contentData)
      .select()
      .single()

    if (contentError) {
      console.error('❌ Failed to save content - Error details:', JSON.stringify(contentError, null, 2))
      console.error('❌ Content data that failed:', JSON.stringify(contentData, null, 2))
      throw contentError
    }

    if (!savedContent) {
      console.error('❌ No content returned from insert operation')
      throw new Error('No content returned from database')
    }

    console.log('✅ Content saved successfully:', JSON.stringify(savedContent, null, 2))

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

  } catch (error: any) {
    console.error('Error running scheduled content generation:', error)
    const errorMessage = error.message || 'Unknown error occurred'
    const errorDetails = {
      message: errorMessage,
      stack: error.stack,
      name: error.name
    }
    console.error('Error details:', errorDetails)
    
    return NextResponse.json(
      { 
        error: 'Failed to run scheduled generation', 
        message: errorMessage,
        details: errorDetails 
      },
      { status: 500 }
    )
  }
}

