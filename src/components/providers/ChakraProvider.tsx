'use client'

import { ChakraProvider as ChakraUIProvider, ColorModeScript } from '@chakra-ui/react'
import theme from '@/lib/theme'

export function ChakraProvider({ children }: { children: React.ReactNode }) {
  return (
    <ChakraUIProvider theme={theme} resetCSS>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      {children}
    </ChakraUIProvider>
  )
}