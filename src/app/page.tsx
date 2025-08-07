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
      <Container maxW="6xl" py={{ base: 8, md: 16 }} px={{ base: 4, md: 8 }}>
        <VStack spacing={{ base: 12, md: 16 }} align="center" textAlign="center">
          {/* Hero Section */}
          <VStack spacing={{ base: 4, md: 6 }} maxW="4xl" px={{ base: 4, md: 0 }}>
            <Heading 
              size={{ base: "xl", md: "2xl" }} 
              fontWeight="bold" 
              lineHeight="1.2"
              px={{ base: 2, md: 0 }}
            >
              AI로 SNS 콘텐츠를
              <br />
              <Text as="span" color="brand.500">자동 생성하세요</Text>
            </Heading>
            <Text 
              fontSize={{ base: "md", md: "lg" }} 
              color="gray.600" 
              maxW={{ base: "full", md: "2xl" }}
              px={{ base: 2, md: 0 }}
              lineHeight={{ base: "1.6", md: "1.5" }}
            >
              AI가 당신의 SNS 콘텐츠를 자동으로 만들고 스케줄링해드립니다.
              더 이상 매일 무엇을 포스팅할지 고민하지 마세요.
            </Text>
          </VStack>

          {/* CTA Buttons */}
          <VStack spacing={{ base: 3, md: 0 }} w="full" maxW="md">
            <HStack 
              spacing={{ base: 2, md: 4 }} 
              direction={{ base: "column", sm: "row" }}
              w="full"
              justify="center"
            >
              <Button
                size={{ base: "md", md: "lg" }}
                colorScheme="brand"
                leftIcon={<AddIcon />}
                onClick={() => router.push('/content/create')}
                px={{ base: 6, md: 8 }}
                py={{ base: 4, md: 6 }}
                fontSize={{ base: "sm", md: "md" }}
                w={{ base: "full", sm: "auto" }}
                minH="48px"
              >
                콘텐츠 생성하기
              </Button>
              <Button
                size={{ base: "md", md: "lg" }}
                variant="outline"
                leftIcon={<CalendarIcon />}
                onClick={() => router.push('/schedule')}
                px={{ base: 6, md: 8 }}
                py={{ base: 4, md: 6 }}
                fontSize={{ base: "sm", md: "md" }}
                w={{ base: "full", sm: "auto" }}
                minH="48px"
              >
                자동 스케줄 설정
              </Button>
            </HStack>
          </VStack>

          {/* Features */}
          <SimpleGrid 
            columns={{ base: 1, md: 3 }} 
            spacing={{ base: 6, md: 8 }} 
            w="full" 
            maxW="4xl"
            px={{ base: 4, md: 0 }}
          >
            <Card 
              shadow={{ base: "md", md: "lg" }}
              transition="all 0.2s"
              _hover={{ transform: "translateY(-2px)", shadow: "xl" }}
            >
              <CardBody textAlign="center" py={{ base: 6, md: 8 }} px={{ base: 4, md: 6 }}>
                <Text fontSize={{ base: "2xl", md: "3xl" }} mb={{ base: 3, md: 4 }}>🤖</Text>
                <Heading size={{ base: "sm", md: "md" }} mb={{ base: 2, md: 3 }}>
                  AI 자동 생성
                </Heading>
                <Text 
                  color="gray.600" 
                  fontSize={{ base: "sm", md: "md" }}
                  lineHeight={{ base: "1.5", md: "1.4" }}
                >
                  주제만 입력하면 AI가 트위터, 인스타그램, 링크드인 등 다양한 플랫폼에 맞는 콘텐츠를 생성합니다.
                </Text>
              </CardBody>
            </Card>

            <Card 
              shadow={{ base: "md", md: "lg" }}
              transition="all 0.2s"
              _hover={{ transform: "translateY(-2px)", shadow: "xl" }}
            >
              <CardBody textAlign="center" py={{ base: 6, md: 8 }} px={{ base: 4, md: 6 }}>
                <Text fontSize={{ base: "2xl", md: "3xl" }} mb={{ base: 3, md: 4 }}>⏰</Text>
                <Heading size={{ base: "sm", md: "md" }} mb={{ base: 2, md: 3 }}>
                  자동 스케줄링
                </Heading>
                <Text 
                  color="gray.600" 
                  fontSize={{ base: "sm", md: "md" }}
                  lineHeight={{ base: "1.5", md: "1.4" }}
                >
                  원하는 시간에 자동으로 콘텐츠가 생성되고 준비됩니다. 매일, 매주 등 주기를 설정할 수 있어요.
                </Text>
              </CardBody>
            </Card>

            <Card 
              shadow={{ base: "md", md: "lg" }}
              transition="all 0.2s"
              _hover={{ transform: "translateY(-2px)", shadow: "xl" }}
            >
              <CardBody textAlign="center" py={{ base: 6, md: 8 }} px={{ base: 4, md: 6 }}>
                <Text fontSize={{ base: "2xl", md: "3xl" }} mb={{ base: 3, md: 4 }}>📊</Text>
                <Heading size={{ base: "sm", md: "md" }} mb={{ base: 2, md: 3 }}>
                  간편한 관리
                </Heading>
                <Text 
                  color="gray.600" 
                  fontSize={{ base: "sm", md: "md" }}
                  lineHeight={{ base: "1.5", md: "1.4" }}
                >
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
