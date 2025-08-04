'use client'

import { ChakraProvider as ChakraUIProvider, ColorModeScript } from '@chakra-ui/react'
import theme from '@/lib/theme'

export function ChakraProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraUIProvider theme={theme}>
        {children}
      </ChakraUIProvider>
    </>
  )
}