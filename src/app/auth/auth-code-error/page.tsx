'use client'

import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  Alert,
  AlertIcon,
  Container,
} from '@chakra-ui/react'
import { useRouter } from 'next/navigation'

export default function AuthCodeError() {
  const router = useRouter()

  return (
    <Container maxW="md" py={20}>
      <VStack spacing={6}>
        <Alert status="error">
          <AlertIcon />
          Authentication Error
        </Alert>
        
        <VStack spacing={4} textAlign="center">
          <Heading size="lg">Something went wrong</Heading>
          <Text color="gray.600">
            There was an error processing your authentication request. 
            This could be due to an expired or invalid link.
          </Text>
        </VStack>

        <VStack spacing={3} width="100%">
          <Button
            colorScheme="brand"
            width="100%"
            onClick={() => router.push('/')}
          >
            Go to Homepage
          </Button>
          <Button
            variant="outline"
            width="100%"
            onClick={() => router.push('/auth/signin')}
          >
            Try Signing In Again
          </Button>
        </VStack>
      </VStack>
    </Container>
  )
}