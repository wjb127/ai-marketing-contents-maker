'use client'

import { ChakraProvider as ChakraUIProvider } from '@chakra-ui/react'
import theme from '@/lib/theme'

export function ChakraProvider({ children }: { children: React.ReactNode }) {
  return (
    <ChakraUIProvider theme={theme} resetCSS>
      {children}
    </ChakraUIProvider>
  )
}