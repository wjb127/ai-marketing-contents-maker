'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Alert,
  AlertIcon,
  Spinner,
  Card,
  CardBody,
  HStack,
  Badge,
} from '@chakra-ui/react'
import { CheckIcon } from '@chakra-ui/icons'

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        const paymentKey = searchParams.get('paymentKey')
        const orderId = searchParams.get('orderId')
        const amount = searchParams.get('amount')

        if (!paymentKey || !orderId || !amount) {
          throw new Error('결제 정보가 누락되었습니다.')
        }

        const response = await fetch('/api/payment/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: parseInt(amount),
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || '결제 확인 중 오류가 발생했습니다.')
        }

        setPaymentData(result)
      } catch (error: any) {
        console.error('Payment confirmation error:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    confirmPayment()
  }, [searchParams])

  if (loading) {
    return (
      <Container maxW="md" py={20}>
        <VStack spacing={6} textAlign="center">
          <Spinner size="xl" color="brand.500" />
          <Heading size="lg">결제 확인 중...</Heading>
          <Text color="gray.600">
            결제를 확인하고 있습니다. 잠시만 기다려주세요.
          </Text>
        </VStack>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxW="md" py={20}>
        <VStack spacing={6}>
          <Alert status="error">
            <AlertIcon />
            결제 확인 실패
          </Alert>
          
          <VStack spacing={4} textAlign="center">
            <Heading size="lg">결제 확인에 실패했습니다</Heading>
            <Text color="gray.600">{error}</Text>
          </VStack>

          <VStack spacing={3} width="100%">
            <Button
              colorScheme="brand"
              width="100%"
              onClick={() => router.push('/subscription')}
            >
              구독 페이지로 돌아가기
            </Button>
            <Button
              variant="outline"
              width="100%"
              onClick={() => router.push('/')}
            >
              홈으로 가기
            </Button>
          </VStack>
        </VStack>
      </Container>
    )
  }

  return (
    <Container maxW="md" py={20}>
      <VStack spacing={8}>
        <Alert status="success" borderRadius="lg">
          <AlertIcon />
          결제가 성공적으로 완료되었습니다!
        </Alert>

        <Box textAlign="center">
          <CheckIcon color="green.500" boxSize={16} mb={4} />
          <Heading size="xl" mb={2}>
            결제 완료
          </Heading>
          <Text color="gray.600" fontSize="lg">
            구독이 활성화되었습니다
          </Text>
        </Box>

        {paymentData && (
          <Card width="100%">
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md" textAlign="center" mb={4}>
                  결제 정보
                </Heading>
                
                <HStack justify="space-between">
                  <Text fontWeight="semibold">상품명:</Text>
                  <Text>{paymentData.orderName}</Text>
                </HStack>
                
                <HStack justify="space-between">
                  <Text fontWeight="semibold">결제 금액:</Text>
                  <Text fontWeight="bold" color="brand.500">
                    ₩{paymentData.amount?.toLocaleString()}
                  </Text>
                </HStack>
                
                <HStack justify="space-between">
                  <Text fontWeight="semibold">결제 방법:</Text>
                  <Text>{paymentData.method}</Text>
                </HStack>
                
                <HStack justify="space-between">
                  <Text fontWeight="semibold">주문번호:</Text>
                  <Text fontSize="sm" color="gray.600">
                    {paymentData.orderId}
                  </Text>
                </HStack>
                
                <HStack justify="space-between">
                  <Text fontWeight="semibold">구독 플랜:</Text>
                  <Badge colorScheme="brand" size="lg">
                    {paymentData.planType?.toUpperCase()} PLAN
                  </Badge>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        )}

        <VStack spacing={3} width="100%">
          <Button
            colorScheme="brand"
            size="lg"
            width="100%"
            onClick={() => router.push('/dashboard')}
          >
            대시보드로 이동
          </Button>
          <Button
            variant="outline"
            size="md"
            width="100%"
            onClick={() => router.push('/content/create')}
          >
            콘텐츠 생성하기
          </Button>
        </VStack>

        <Text fontSize="sm" color="gray.500" textAlign="center">
          구독은 즉시 활성화되며, 언제든지 구독 설정에서 관리할 수 있습니다.
        </Text>
      </VStack>
    </Container>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <Container maxW="md" py={20}>
        <VStack spacing={6} textAlign="center">
          <Spinner size="xl" color="brand.500" />
          <Heading size="lg">결제 확인 중...</Heading>
          <Text color="gray.600">
            결제를 확인하고 있습니다. 잠시만 기다려주세요.
          </Text>
        </VStack>
      </Container>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}