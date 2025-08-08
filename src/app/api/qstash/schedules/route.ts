import { NextRequest, NextResponse } from 'next/server'
import { listSchedules, createRecurringSchedule, deleteSchedule } from '@/lib/qstash-v2'

// QStash 스케줄 목록 조회
export async function GET() {
  try {
    const schedules = await listSchedules()
    
    return NextResponse.json({
      success: true,
      count: schedules.length,
      schedules,
      message: schedules.length > 0 
        ? '✅ QStash Console의 Schedules 탭에서도 확인 가능합니다!'
        : '📌 아직 생성된 스케줄이 없습니다. POST로 생성해보세요.'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to list schedules', details: error.message },
      { status: 500 }
    )
  }
}

// 테스트용 반복 스케줄 생성
export async function POST(request: NextRequest) {
  try {
    const { scheduleId, frequency, timeOfDay, timezone } = await request.json()
    
    if (!scheduleId || !frequency || !timeOfDay) {
      return NextResponse.json(
        { error: 'Missing required fields: scheduleId, frequency, timeOfDay' },
        { status: 400 }
      )
    }
    
    const qstashScheduleId = await createRecurringSchedule(
      scheduleId,
      frequency,
      timeOfDay,
      timezone
    )
    
    return NextResponse.json({
      success: true,
      qstashScheduleId,
      message: '✅ QStash 반복 스케줄이 생성되었습니다! Console에서 확인하세요.',
      consoleUrl: 'https://console.upstash.com/qstash?tab=schedules'
    })
    
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create schedule', details: error.message },
      { status: 500 }
    )
  }
}

// 스케줄 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const qstashScheduleId = searchParams.get('id')
    
    if (!qstashScheduleId) {
      return NextResponse.json(
        { error: 'Missing schedule ID' },
        { status: 400 }
      )
    }
    
    const success = await deleteSchedule(qstashScheduleId)
    
    return NextResponse.json({
      success,
      message: success ? '✅ 스케줄이 삭제되었습니다.' : '❌ 삭제 실패'
    })
    
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete schedule', details: error.message },
      { status: 500 }
    )
  }
}