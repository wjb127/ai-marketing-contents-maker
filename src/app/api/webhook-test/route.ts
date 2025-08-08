import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const headers = Object.fromEntries(request.headers.entries())
    
    console.log('🔔 Webhook received:', {
      timestamp: new Date().toISOString(),
      headers,
      body,
      url: request.url
    })

    return NextResponse.json({
      success: true,
      message: 'Webhook received successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Webhook test endpoint is ready',
    timestamp: new Date().toISOString()
  })
}