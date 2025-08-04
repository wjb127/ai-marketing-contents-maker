'use client'

import { Box, Container } from '@chakra-ui/react'
import Navbar from './Navbar'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar />
      <Container maxW="7xl" py={8}>
        {children}
      </Container>
    </Box>
  )
}