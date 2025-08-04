'use client'

import { useAuth } from '@/hooks/useAuth'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Box, Button, VStack, Heading, Text } from '@chakra-ui/react'
import { useState } from 'react'
import AuthModal from './AuthModal'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  if (loading) {
    return <LoadingSpinner text="Loading..." />
  }

  if (!user) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <Box textAlign="center" py={20}>
        <VStack spacing={6}>
          <Heading size="lg">Authentication Required</Heading>
          <Text color="gray.600">
            Please sign in to access this content.
          </Text>
          <Button 
            colorScheme="brand" 
            onClick={() => setShowAuthModal(true)}
          >
            Sign In
          </Button>
        </VStack>
        
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      </Box>
    )
  }

  return <>{children}</>
}