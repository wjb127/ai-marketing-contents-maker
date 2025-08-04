'use client'

import { Box, Spinner, Text, VStack } from '@chakra-ui/react'

interface LoadingSpinnerProps {
  text?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function LoadingSpinner({ text = 'Loading...', size = 'md' }: LoadingSpinnerProps) {
  return (
    <VStack spacing={4} py={8}>
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color="brand.500"
        size={size}
      />
      <Text color="gray.600" fontSize="sm">
        {text}
      </Text>
    </VStack>
  )
}