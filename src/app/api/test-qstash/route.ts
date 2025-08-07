import { NextRequest, NextResponse } from 'next/server'
import { scheduleContentGeneration } from '@/lib/qstash'

export async function POST(request: NextRequest) {
  try {
    const { scheduleId } = await request.json()
    
    if (!scheduleId) {
      return NextResponse.json(
        { error: 'scheduleId is required' },
        { status: 400 }
      )
    }

    // Test QStash scheduling with a time 2 minutes from now
    const executeAt = new Date(Date.now() + 2 * 60 * 1000) // 2 minutes from now
    
    console.log('🧪 Testing QStash scheduling:', {
      scheduleId,
      executeAt: executeAt.toISOString(),
      executeAtKST: new Date(executeAt.getTime() + 12 * 60 * 60 * 1000).toISOString()
    })

    const messageId = await scheduleContentGeneration(scheduleId, executeAt)
    
    return NextResponse.json({
      success: true,
      messageId,
      executeAt: executeAt.toISOString(),
      message: 'QStash test completed successfully'
    })

  } catch (error: any) {
    console.error('🚨 QStash test failed:', error)
    return NextResponse.json(
      { 
        error: 'QStash test failed', 
        details: error.message,
        stack: error.stack 
      },
      { status: 500 }
    )
  }
}