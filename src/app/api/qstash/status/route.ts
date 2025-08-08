import { NextRequest, NextResponse } from 'next/server'

// QStash 메시지 상태 확인 API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('messageId')
    
    if (!messageId) {
      // 최근 메시지 목록 조회
      const response = await fetch('https://qstash.upstash.io/v2/messages', {
        headers: {
          'Authorization': `Bearer ${process.env.QSTASH_TOKEN}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`QStash API error: ${response.status}`)
      }
      
      const messages = await response.json()
      return NextResponse.json({
        messages,
        count: messages.length
      })
    }
    
    // 특정 메시지 상태 조회
    const response = await fetch(`https://qstash.upstash.io/v2/messages/${messageId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.QSTASH_TOKEN}`
      }
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Message not found' },
          { status: 404 }
        )
      }
      throw new Error(`QStash API error: ${response.status}`)
    }
    
    const messageStatus = await response.json()
    
    return NextResponse.json({
      messageId,
      status: messageStatus,
      message: 'Message status retrieved successfully'
    })
    
  } catch (error: any) {
    console.error('❌ QStash status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check QStash status', details: error.message },
      { status: 500 }
    )
  }
}

// QStash 로그 조회
export async function POST(request: NextRequest) {
  try {
    const { messageId } = await request.json()
    
    if (!messageId) {
      return NextResponse.json(
        { error: 'messageId is required' },
        { status: 400 }
      )
    }
    
    // QStash 로그 조회
    const response = await fetch(`https://qstash.upstash.io/v2/logs/${messageId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.QSTASH_TOKEN}`
      }
    })
    
    if (!response.ok) {
      throw new Error(`QStash API error: ${response.status}`)
    }
    
    const logs = await response.json()
    
    return NextResponse.json({
      messageId,
      logs,
      message: 'Logs retrieved successfully'
    })
    
  } catch (error: any) {
    console.error('❌ QStash logs check error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve QStash logs', details: error.message },
      { status: 500 }
    )
  }
}