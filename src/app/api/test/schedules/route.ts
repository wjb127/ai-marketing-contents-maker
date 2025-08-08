import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// 테스트 스케줄 조회 API
export async function GET() {
  try {
    const supabase = await createClient()
    
    // 테스트 스케줄만 조회 (이름에 '테스트'가 포함되거나 test-dashboard에서 생성된 것들)
    const { data: schedules, error } = await supabase
      .from('schedules')
      .select('*')
      .or('name.ilike.%테스트%,name.ilike.%test%,name.ilike.%API 테스트%')
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (error) {
      console.error('Failed to fetch test schedules:', error)
      return NextResponse.json(
        { error: 'Failed to fetch schedules', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      schedules: schedules || [],
      count: schedules?.length || 0
    })
    
  } catch (error: any) {
    console.error('Test schedules API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}