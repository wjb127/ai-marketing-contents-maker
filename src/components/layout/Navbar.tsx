'use client'

import {
  Box,
  Flex,
  Text,
  IconButton,
  Button,
  Stack,
  Collapse,
  Icon,
  Link,
  Popover,
  PopoverTrigger,
  PopoverContent,
  useColorModeValue,
  useDisclosure,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
} from '@chakra-ui/react'
import NextLink from 'next/link'
import {
  HamburgerIcon,
  CloseIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  AddIcon,
} from '@chakra-ui/icons'
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'
import AuthModal from '@/components/auth/AuthModal'

export default function Navbar() {
  const { isOpen, onToggle } = useDisclosure()
  const { user, signOut } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalTab, setAuthModalTab] = useState(0)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const openAuthModal = (tab: number) => {
    setAuthModalTab(tab)
    setShowAuthModal(true)
  }

  return (
    <Box>
      <Flex
        bg={useColorModeValue('white', 'gray.800')}
        color={useColorModeValue('gray.600', 'white')}
        minH={{ base: '56px', md: '60px' }}
        py={{ base: 2, md: 3 }}
        px={{ base: 4, md: 6 }}
        borderBottom={1}
        borderStyle={'solid'}
        borderColor={useColorModeValue('gray.200', 'gray.900')}
        align={'center'}
        position="sticky"
        top={0}
        zIndex={1000}
        backdropFilter="blur(10px)"
        boxShadow="sm">
        <Flex
          flex={{ base: 1, md: 'auto' }}
          ml={{ base: -2 }}
          display={{ base: 'flex', md: 'none' }}>
          <IconButton
            onClick={onToggle}
            icon={
              isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />
            }
            variant={'ghost'}
            aria-label={'Toggle Navigation'}
            size="lg"
            minH="48px"
            minW="48px"
            borderRadius="md"
            _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
            _active={{ bg: useColorModeValue('gray.200', 'gray.600') }}
          />
        </Flex>
        <Flex flex={{ base: 1 }} justify={{ base: 'center', md: 'start' }}>
          <Text
            textAlign={{ base: 'center', md: 'left' }}
            fontFamily={'heading'}
            color={useColorModeValue('gray.800', 'white')}
            fontSize={{ base: 'lg', md: 'xl' }}
            fontWeight={'bold'}
            py={2}
            noOfLines={1}>
            AI SNS Maker
          </Text>

          <Flex display={{ base: 'none', md: 'flex' }} ml={10}>
            <DesktopNav />
          </Flex>
        </Flex>

        <Stack
          flex={{ base: 1, md: 0 }}
          justify={'flex-end'}
          direction={'row'}
          spacing={6}>
          {/* DOGFOODING MODE: Always show as logged in */}
          <Menu>
            <MenuButton
              as={Button}
              rounded={'full'}
              variant={'link'}
              cursor={'pointer'}
              minW={0}>
              <Avatar
                size={'sm'}
                name="Dogfooding User"
              />
            </MenuButton>
            <MenuList>
              <MenuItem>
                <Text fontSize="sm" color="gray.600">
                  dogfooding@test.com
                </Text>
              </MenuItem>
              <MenuDivider />
              <MenuItem>Profile (Disabled)</MenuItem>
              <MenuItem>Settings (Disabled)</MenuItem>
              <MenuDivider />
              <MenuItem color="gray.400" cursor="not-allowed">
                Dogfooding Mode
              </MenuItem>
            </MenuList>
          </Menu>
        </Stack>
      </Flex>

      <Collapse in={isOpen} animateOpacity>
        <MobileNav />
      </Collapse>

      {/* DOGFOODING MODE: Auth modal disabled */}
    </Box>
  )
}

const DesktopNav = () => {
  const linkColor = useColorModeValue('gray.600', 'gray.200')
  const linkHoverColor = useColorModeValue('gray.800', 'white')
  const popoverContentBgColor = useColorModeValue('white', 'gray.800')

  return (
    <Stack direction={'row'} spacing={4}>
      {NAV_ITEMS.map((navItem) => (
        <Box key={navItem.label}>
          <Popover trigger={'hover'} placement={'bottom-start'}>
            <PopoverTrigger>
              {navItem.href ? (
                <NextLink href={navItem.href}>
                  <Box
                    p={2}
                    fontSize={'sm'}
                    fontWeight={500}
                    color={linkColor}
                    _hover={{
                      textDecoration: 'none',
                      color: linkHoverColor,
                    }}>
                    {navItem.label}
                  </Box>
                </NextLink>
              ) : (
                <Box
                  p={2}
                  fontSize={'sm'}
                  fontWeight={500}
                  color={linkColor}
                  cursor="pointer">
                  {navItem.label}
                </Box>
              )}
            </PopoverTrigger>

            {navItem.children && (
              <PopoverContent
                border={0}
                boxShadow={'xl'}
                bg={popoverContentBgColor}
                p={4}
                rounded={'xl'}
                minW={'sm'}>
                <Stack>
                  {navItem.children.map((child) => (
                    <DesktopSubNav key={child.label} {...child} />
                  ))}
                </Stack>
              </PopoverContent>
            )}
          </Popover>
        </Box>
      ))}
    </Stack>
  )
}

const DesktopSubNav = ({ label, href, subLabel }: NavItem) => {
  return (
    <NextLink href={href || '#'}>
      <Box
        role={'group'}
        display={'block'}
        p={2}
        rounded={'md'}
        _hover={{ bg: useColorModeValue('brand.50', 'gray.900') }}>
      <Stack direction={'row'} align={'center'}>
        <Box>
          <Text
            transition={'all .3s ease'}
            _groupHover={{ color: 'brand.400' }}
            fontWeight={500}>
            {label}
          </Text>
          <Text fontSize={'sm'}>{subLabel}</Text>
        </Box>
        <Flex
          transition={'all .3s ease'}
          transform={'translateX(-10px)'}
          opacity={0}
          _groupHover={{ opacity: '100%', transform: 'translateX(0)' }}
          justify={'flex-end'}
          align={'center'}
          flex={1}>
          <Icon color={'brand.400'} w={5} h={5} as={ChevronRightIcon} />
        </Flex>
      </Stack>
      </Box>
    </NextLink>
  )
}

const MobileNav = () => {
  return (
    <Stack
      bg={useColorModeValue('white', 'gray.800')}
      p={{ base: 4, sm: 6 }}
      display={{ md: 'none' }}
      spacing={2}
      borderBottom={1}
      borderStyle={'solid'}
      borderColor={useColorModeValue('gray.200', 'gray.700')}
      boxShadow="md">
      {NAV_ITEMS.map((navItem) => (
        <MobileNavItem key={navItem.label} {...navItem} />
      ))}
    </Stack>
  )
}

const MobileNavItem = ({ label, children, href }: NavItem) => {
  const { isOpen, onToggle } = useDisclosure()

  return (
    <Stack spacing={3} onClick={children && onToggle}>
      {href ? (
        <NextLink href={href}>
          <Box
            py={3}
            px={2}
            borderRadius="md"
            minH="48px"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            _hover={{
              textDecoration: 'none',
              bg: useColorModeValue('gray.50', 'gray.700')
            }}
            _active={{
              bg: useColorModeValue('gray.100', 'gray.600')
            }}
            transition="all 0.2s">
            <Text
              fontWeight={600}
              fontSize="md"
              color={useColorModeValue('gray.700', 'gray.200')}>
              {label}
            </Text>
          </Box>
        </NextLink>
      ) : (
        <Flex
          py={3}
          px={2}
          borderRadius="md"
          minH="48px"
          justifyContent="space-between"
          alignItems="center"
          cursor="pointer"
          _hover={{
            bg: useColorModeValue('gray.50', 'gray.700')
          }}
          _active={{
            bg: useColorModeValue('gray.100', 'gray.600')
          }}
          transition="all 0.2s">
          <Text
            fontWeight={600}
            fontSize="md"
            color={useColorModeValue('gray.700', 'gray.200')}>
            {label}
          </Text>
          {children && (
            <Icon
              as={ChevronDownIcon}
              transition={'all .25s ease-in-out'}
              transform={isOpen ? 'rotate(180deg)' : ''}
              w={5}
              h={5}
              color={useColorModeValue('gray.500', 'gray.400')}
            />
          )}
        </Flex>
      )}

      <Collapse in={isOpen} animateOpacity style={{ marginTop: '0!important' }}>
        <Stack
          mt={2}
          pl={4}
          borderLeft={2}
          borderStyle={'solid'}
          borderColor={useColorModeValue('brand.200', 'brand.600')}
          spacing={1}>
          {children &&
            children.map((child) => (
              <NextLink key={child.label} href={child.href || '#'}>
                <Box 
                  py={3}
                  px={3}
                  borderRadius="md"
                  minH="44px"
                  display="flex"
                  alignItems="center"
                  _hover={{
                    bg: useColorModeValue('brand.50', 'brand.900'),
                    textDecoration: 'none'
                  }}
                  _active={{
                    bg: useColorModeValue('brand.100', 'brand.800')
                  }}
                  transition="all 0.2s">
                  <Text 
                    fontSize="sm" 
                    fontWeight={500}
                    color={useColorModeValue('gray.600', 'gray.300')}>
                    {child.label}
                  </Text>
                </Box>
              </NextLink>
            ))}
        </Stack>
      </Collapse>
    </Stack>
  )
}

interface NavItem {
  label: string
  subLabel?: string
  children?: Array<NavItem>
  href?: string
}

const NAV_ITEMS: Array<NavItem> = [
  {
    label: '홈',
    href: '/',
  },
  {
    label: '스케줄',
    children: [
      {
        label: '자동 스케줄',
        subLabel: '콘텐츠 자동 생성 스케줄을 설정하세요',
        href: '/schedule',
      },
    ],
  },
  {
    label: '콘텐츠',
    children: [
      {
        label: '콘텐츠 생성',
        subLabel: 'AI로 새로운 콘텐츠를 생성하세요',
        href: '/content/create',
      },
      {
        label: '콘텐츠 관리',
        subLabel: '생성된 콘텐츠를 확인하고 관리하세요',
        href: '/content/library',
      },
    ],
  },
  {
    label: '구독',
    href: '/subscription',
  },
]