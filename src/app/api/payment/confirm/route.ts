import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { paymentKey, orderId, amount } = await request.json()

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { error: 'Missing required payment parameters' },
        { status: 400 }
      )
    }

    // TossPayments API를 통해 결제 확인
    const tossResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.TOSS_PAYMENTS_SECRET_KEY! + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    })

    const tossData = await tossResponse.json()

    if (!tossResponse.ok) {
      console.error('TossPayments API Error:', tossData)
      return NextResponse.json(
        { error: tossData.message || 'Payment confirmation failed' },
        { status: 400 }
      )
    }

    // 메타데이터에서 플랜 정보 추출
    const metadata = tossData.metadata || {}
    const planId = metadata.planId || 'pro' // 기본값

    // 플랜별 구독 기간 설정
    const subscriptionEndDate = new Date()
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1) // 1개월 추가

    // 결제 정보를 데이터베이스에 저장
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        toss_payment_key: paymentKey,
        toss_order_id: orderId,
        amount: amount,
        plan_type: planId,
        status: tossData.status,
        approved_at: new Date(tossData.approvedAt),
      })

    if (paymentError) {
      console.error('Payment DB Error:', paymentError)
      return NextResponse.json(
        { error: 'Failed to save payment information' },
        { status: 500 }
      )
    }

    // 사용자 구독 정보 업데이트
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        subscription_plan: planId,
        subscription_status: 'active',
        subscription_end_date: subscriptionEndDate.toISOString(),
        monthly_content_count: 0, // 구독 시작 시 카운트 리셋
        monthly_reset_date: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (userUpdateError) {
      console.error('User Update Error:', userUpdateError)
      return NextResponse.json(
        { error: 'Failed to update subscription status' },
        { status: 500 }
      )
    }

    // 성공 응답
    return NextResponse.json({
      success: true,
      orderId: tossData.orderId,
      orderName: tossData.orderName,
      amount: tossData.totalAmount,
      method: tossData.method,
      approvedAt: tossData.approvedAt,
      planType: planId,
    })

  } catch (error) {
    console.error('Payment confirmation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}