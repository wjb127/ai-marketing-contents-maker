import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// 완전히 새로운 버전 - 최소한의 기능으로 시작
async function handler(request: NextRequest) {
  try {
    console.log('🚀 Generate-scheduled-v2 API called')
    
    const body = await request.json()
    const scheduleId = body.scheduleId
    
    if (!scheduleId) {
      return NextResponse.json({ error: 'No schedule ID' }, { status: 400 })
    }
    
    console.log('📋 Processing schedule:', scheduleId)
    
    // 테스트 대시보드에 즉시 기록
    try {
      const loggerUrl = `${process.env.NEXT_PUBLIC_URL?.trim()}/api/test/time-logger`
      await fetch(loggerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: scheduleId,
          timestamp: new Date().toISOString()
        })
      })
      console.log('✅ Logged to time-logger successfully')
    } catch (logError) {
      console.error('Failed to log:', logError)
    }
    
    return NextResponse.json({
      success: true,
      message: 'v2 API executed successfully',
      scheduleId
    })
    
  } catch (error: any) {
    console.error('❌ v2 API error:', error?.message || error)
    return NextResponse.json(
      { error: 'v2 API failed', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

export const POST = handler