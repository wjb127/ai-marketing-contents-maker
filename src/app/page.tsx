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

          {/* Features - Mobile Horizontal Scroll */}
          <Box w="full" overflow="auto" pb={2}>
            <HStack 
              spacing={3}
              align="stretch"
              minW={{ base: "max-content", md: "auto" }}
              justify={{ base: "flex-start", md: "center" }}
              px={{ base: 4, md: 0 }}
            >
              {/* AI 자동 생성 */}
              <Card 
                minW={{ base: "100px", md: "280px" }}
                maxW={{ base: "100px", md: "280px" }}
                shadow="sm"
                borderRadius="lg"
              >
                <CardBody 
                  textAlign="center" 
                  py={{ base: 3, md: 6 }} 
                  px={{ base: 2, md: 4 }}
                >
                  <Text fontSize={{ base: "xl", md: "2xl" }} mb={1}>🤖</Text>
                  <Text 
                    fontSize={{ base: "xs", md: "md" }}
                    fontWeight="bold"
                    mb={{ base: 1, md: 2 }}
                  >
                    AI 생성
                  </Text>
                  <Text 
                    color="gray.600" 
                    fontSize={{ base: "2xs", md: "sm" }}
                    display={{ base: "none", md: "block" }}
                  >
                    주제만 입력하면 다양한 SNS 콘텐츠 자동 생성
                  </Text>
                </CardBody>
              </Card>

              {/* 자동 스케줄링 */}
              <Card 
                minW={{ base: "100px", md: "280px" }}
                maxW={{ base: "100px", md: "280px" }}
                shadow="sm"
                borderRadius="lg"
              >
                <CardBody 
                  textAlign="center" 
                  py={{ base: 3, md: 6 }} 
                  px={{ base: 2, md: 4 }}
                >
                  <Text fontSize={{ base: "xl", md: "2xl" }} mb={1}>⏰</Text>
                  <Text 
                    fontSize={{ base: "xs", md: "md" }}
                    fontWeight="bold"
                    mb={{ base: 1, md: 2 }}
                  >
                    스케줄링
                  </Text>
                  <Text 
                    color="gray.600" 
                    fontSize={{ base: "2xs", md: "sm" }}
                    display={{ base: "none", md: "block" }}
                  >
                    원하는 시간에 자동으로 콘텐츠 생성
                  </Text>
                </CardBody>
              </Card>

              {/* 창의성 조절 */}
              <Card 
                minW={{ base: "100px", md: "280px" }}
                maxW={{ base: "100px", md: "280px" }}
                shadow="sm"
                borderRadius="lg"
              >
                <CardBody 
                  textAlign="center" 
                  py={{ base: 3, md: 6 }} 
                  px={{ base: 2, md: 4 }}
                >
                  <Text fontSize={{ base: "xl", md: "2xl" }} mb={1}>🎨</Text>
                  <Text 
                    fontSize={{ base: "xs", md: "md" }}
                    fontWeight="bold"
                    mb={{ base: 1, md: 2 }}
                  >
                    창의성
                  </Text>
                  <Text 
                    color="gray.600" 
                    fontSize={{ base: "2xs", md: "sm" }}
                    display={{ base: "none", md: "block" }}
                  >
                    4단계 레벨로 콘텐츠 다양성 조절
                  </Text>
                </CardBody>
              </Card>
            </HStack>
          </Box>
        </VStack>
      </Container>
    </Layout>
  )
}
