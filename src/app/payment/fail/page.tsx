'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'
import { WarningIcon } from '@chakra-ui/icons'

function PaymentFailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const code = searchParams.get('code')
  const message = searchParams.get('message')

  const getErrorMessage = (code: string | null) => {
    switch (code) {
      case 'PAY_PROCESS_CANCELED':
        return '사용자가 결제를 취소했습니다.'
      case 'PAY_PROCESS_ABORTED':
        return '결제 진행 중 오류가 발생했습니다.'
      case 'REJECT_CARD_COMPANY':
        return '카드사에서 결제를 거부했습니다.'
      default:
        return message || '결제 처리 중 오류가 발생했습니다.'
    }
  }

  return (
    <Container maxW="md" py={20}>
      <VStack spacing={8}>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          결제가 실패했습니다
        </Alert>

        <Box textAlign="center">
          <WarningIcon color="red.500" boxSize={16} mb={4} />
          <Heading size="xl" mb={2}>
            결제 실패
          </Heading>
          <Text color="gray.600" fontSize="lg" mb={4}>
            결제 처리 중 문제가 발생했습니다
          </Text>
          <Text color="red.600" fontWeight="medium">
            {getErrorMessage(code)}
          </Text>
        </Box>

        <VStack spacing={3} width="100%">
          <Button
            colorScheme="brand"
            size="lg"
            width="100%"
            onClick={() => router.push('/subscription')}
          >
            다시 시도하기
          </Button>
          <Button
            variant="outline"
            size="md"
            width="100%"
            onClick={() => router.push('/')}
          >
            홈으로 가기
          </Button>
        </VStack>

        <Box textAlign="center" pt={4}>
          <Text fontSize="sm" color="gray.500" mb={2}>
            결제에 문제가 지속될 경우
          </Text>
          <Button variant="link" size="sm" colorScheme="brand">
            고객지원 문의하기
          </Button>
        </Box>
      </VStack>
    </Container>
  )
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={
      <Container maxW="md" py={20}>
        <VStack spacing={8}>
          <Alert status="error" borderRadius="lg">
            <AlertIcon />
            결제 정보를 불러오는 중...
          </Alert>
          <Box textAlign="center">
            <WarningIcon color="red.500" boxSize={16} mb={4} />
            <Heading size="xl" mb={2}>
              결제 실패
            </Heading>
            <Text color="gray.600" fontSize="lg">
              결제 정보를 불러오는 중입니다...
            </Text>
          </Box>
        </VStack>
      </Container>
    }>
      <PaymentFailContent />
    </Suspense>
  )
}