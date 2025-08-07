import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  breakpoints: {
    base: '0px',
    sm: '480px',
    md: '768px',
    lg: '992px',
    xl: '1280px',
    '2xl': '1536px',
  },
  colors: {
    brand: {
      50: '#e3f2fd',
      100: '#bbdefb',
      200: '#90caf9',
      300: '#64b5f6',
      400: '#42a5f5',
      500: '#2196f3',
      600: '#1e88e5',
      700: '#1976d2',
      800: '#1565c0',
      900: '#0d47a1',
    },
    gray: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
  },
  fonts: {
    heading: 'var(--font-geist-sans)',
    body: 'var(--font-geist-sans)',
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
  space: {
    px: '1px',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem',
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
      baseStyle: {
        borderRadius: 'md',
        fontWeight: 'semibold',
        cursor: 'pointer',
        transition: 'all 0.2s',
        _focus: {
          boxShadow: 'outline',
        },
        _disabled: {
          opacity: 0.4,
          cursor: 'not-allowed',
          pointerEvents: 'none',
        },
      },
      sizes: {
        sm: {
          h: '32px',
          minW: '32px',
          fontSize: 'sm',
          px: 3,
        },
        md: {
          h: { base: '44px', md: '40px' },
          minW: { base: '44px', md: '40px' },
          fontSize: { base: 'sm', md: 'md' },
          px: { base: 4, md: 4 },
        },
        lg: {
          h: { base: '48px', md: '48px' },
          minW: { base: '48px', md: '48px' },
          fontSize: { base: 'md', md: 'lg' },
          px: { base: 6, md: 6 },
        },
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600',
            _disabled: {
              bg: 'brand.500',
            },
          },
          _active: {
            bg: 'brand.700',
          },
        },
        outline: {
          border: '2px solid',
          borderColor: 'brand.500',
          color: 'brand.500',
          _hover: {
            bg: 'brand.50',
            _disabled: {
              bg: 'transparent',
            },
          },
          _active: {
            bg: 'brand.100',
          },
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: 'lg',
          boxShadow: 'md',
          bg: 'white',
          _dark: {
            bg: 'gray.800',
          },
        },
      },
    },
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
})

export default theme