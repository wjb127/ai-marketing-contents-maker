'use client'

import { Box, Container } from '@chakra-ui/react'
import Navbar from './Navbar'
import PageTransition from './PageTransition'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar />
      <Container 
        maxW="7xl" 
        py={{ base: 4, md: 8 }}
        px={{ base: 4, md: 6 }}
        w="full">
        <PageTransition>
          {children}
        </PageTransition>
      </Container>
    </Box>
  )
}