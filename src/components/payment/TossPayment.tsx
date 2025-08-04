'use client'

import { useEffect } from 'react'
import { loadTossPayments } from '@tosspayments/payment-sdk'
import { Button, useToast } from '@chakra-ui/react'
import { SubscriptionPlan } from '@/types'
import { useAuth } from '@/hooks/useAuth'

interface TossPaymentProps {
  plan: SubscriptionPlan
  onSuccess?: () => void
  onError?: (error: any) => void
}

export default function TossPayment({ plan, onSuccess, onError }: TossPaymentProps) {
  const { user } = useAuth()
  const toast = useToast()

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to proceed with payment.',
        status: 'error',
        duration: 3000,
      })
      return
    }

    try {
      const tossPayments = await loadTossPayments(
        process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY!
      )

      const orderId = `order_${Date.now()}_${user.id.slice(0, 8)}`
      const orderName = `${plan.name} Plan Subscription`
      const customerEmail = user.email
      const customerName = user.user_metadata?.name || user.email

      await tossPayments.requestPayment('카드', {
        amount: plan.price * 1000, // Convert to KRW (원 단위)
        orderId: orderId,
        orderName: orderName,
        customerEmail: customerEmail,
        customerName: customerName,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        metadata: {
          planId: plan.id,
          userId: user.id,
        },
      })
    } catch (error: any) {
      console.error('Payment error:', error)
      toast({
        title: 'Payment Failed',
        description: error.message || 'An error occurred during payment processing.',
        status: 'error',
        duration: 5000,
      })
      onError?.(error)
    }
  }

  return (
    <Button
      colorScheme="brand"
      size="lg"
      width="100%"
      onClick={handlePayment}
    >
      결제하기 (₩{(plan.price * 1000).toLocaleString()}/월)
    </Button>
  )
}