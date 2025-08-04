'use client'

import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Container,
  SimpleGrid,
  Card,
  CardBody,
} from '@chakra-ui/react'
import { AddIcon, CalendarIcon } from '@chakra-ui/icons'
import Layout from '@/components/layout/Layout'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  return (
    <Layout>
      <Container maxW="6xl" py={16}>
        <VStack spacing={16} align="center" textAlign="center">
          {/* Hero Section */}
          <VStack spacing={6} maxW="4xl">
            <Heading size="2xl" fontWeight="bold" lineHeight="1.2">
              AI로 SNS 콘텐츠를
              <br />
              <Text as="span" color="brand.500">자동 생성하세요</Text>
            </Heading>
            <Text fontSize="lg" color="gray.600" maxW="2xl">
              AI가 당신의 SNS 콘텐츠를 자동으로 만들고 스케줄링해드립니다.
              더 이상 매일 무엇을 포스팅할지 고민하지 마세요.
            </Text>
          </VStack>

          {/* CTA Buttons */}
          <HStack spacing={4}>
            <Button
              size="lg"
              colorScheme="brand"
              leftIcon={<AddIcon />}
              onClick={() => router.push('/content/create')}
              px={8}
              py={6}
              fontSize="md"
            >
              콘텐츠 생성하기
            </Button>
            <Button
              size="lg"
              variant="outline"
              leftIcon={<CalendarIcon />}
              onClick={() => router.push('/schedule')}
              px={8}
              py={6}
              fontSize="md"
            >
              자동 스케줄 설정
            </Button>
          </HStack>

          {/* Features */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} w="full" maxW="4xl">
            <Card>
              <CardBody textAlign="center" py={8}>
                <Text fontSize="3xl" mb={4}>🤖</Text>
                <Heading size="md" mb={3}>
                  AI 자동 생성
                </Heading>
                <Text color="gray.600">
                  주제만 입력하면 AI가 트위터, 인스타그램, 링크드인 등 다양한 플랫폼에 맞는 콘텐츠를 생성합니다.
                </Text>
              </CardBody>
            </Card>

            <Card>
              <CardBody textAlign="center" py={8}>
                <Text fontSize="3xl" mb={4}>⏰</Text>
                <Heading size="md" mb={3}>
                  자동 스케줄링
                </Heading>
                <Text color="gray.600">
                  원하는 시간에 자동으로 콘텐츠가 생성되고 준비됩니다. 매일, 매주 등 주기를 설정할 수 있어요.
                </Text>
              </CardBody>
            </Card>

            <Card>
              <CardBody textAlign="center" py={8}>
                <Text fontSize="3xl" mb={4}>📊</Text>
                <Heading size="md" mb={3}>
                  간편한 관리
                </Heading>
                <Text color="gray.600">
                  생성된 모든 콘텐츠를 한 곳에서 관리하고, 필요에 따라 수정하거나 삭제할 수 있습니다.
                </Text>
              </CardBody>
            </Card>
          </SimpleGrid>
        </VStack>
      </Container>
    </Layout>
  )
}
