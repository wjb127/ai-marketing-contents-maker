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
              주제만 입력하면
              <br />
              <Text as="span" color="brand.500">클리셰에 맞는 SNS 콘텐츠</Text>
              <br />
              완성!
            </Heading>
            <Text 
              fontSize={{ base: "md", md: "lg" }} 
              color="gray.600" 
              maxW={{ base: "full", md: "2xl" }}
              px={{ base: 2, md: 0 }}
              lineHeight={{ base: "1.6", md: "1.5" }}
            >
              트위터, 인스타그램, 블로그까지! 각 플랫폼에 최적화된 
              클리셰 스타일 콘텐츠를 AI가 즉시 생성해드립니다.
            </Text>
          </VStack>

          {/* CTA Button */}
          <VStack spacing={{ base: 3, md: 0 }} w="full" maxW="md">
            <Box w="full" display="flex" justifyContent="center">
              <Button
                size={{ base: "md", md: "lg" }}
                colorScheme="brand"
                leftIcon={<AddIcon />}
                onClick={() => router.push('/content/create')}
                px={{ base: 8, md: 12 }}
                py={{ base: 6, md: 8 }}
                fontSize={{ base: "md", md: "lg" }}
                fontWeight="bold"
                borderRadius="xl"
                boxShadow="lg"
                _hover={{
                  transform: "translateY(-2px)",
                  boxShadow: "xl"
                }}
                transition="all 0.2s"
                minH="56px"
              >
                무료로 콘텐츠 생성하기
              </Button>
            </Box>
          </VStack>

          {/* Features - Mobile Grid */}
          <Box w="full" px={{ base: 2, md: 0 }}>
            <SimpleGrid 
              columns={{ base: 3, md: 3 }}
              spacing={{ base: 2, md: 4 }}
              w="full"
              maxW="5xl"
              mx="auto"
            >
              {/* 클리셰 기반 생성 */}
              <Card 
                shadow="sm"
                borderRadius="lg"
                h="full"
              >
                <CardBody 
                  textAlign="center" 
                  py={{ base: 3, sm: 4, md: 6 }} 
                  px={{ base: 1, sm: 2, md: 4 }}
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                >
                  <Text fontSize={{ base: "lg", sm: "xl", md: "2xl" }} mb={1}>✨</Text>
                  <Text 
                    fontSize={{ base: "2xs", sm: "xs", md: "md" }}
                    fontWeight="bold"
                    mb={{ base: 0.5, md: 2 }}
                  >
                    클리셰 기반
                  </Text>
                  <Text 
                    color="gray.600" 
                    fontSize={{ base: "3xs", sm: "2xs", md: "sm" }}
                    display={{ base: "none", sm: "block" }}
                    lineHeight="1.3"
                  >
                    검증된 SNS 패턴으로 즉시 통하는 콘텐츠
                  </Text>
                </CardBody>
              </Card>

              {/* 다양한 플랫폼 */}
              <Card 
                shadow="sm"
                borderRadius="lg"
                h="full"
              >
                <CardBody 
                  textAlign="center" 
                  py={{ base: 3, sm: 4, md: 6 }} 
                  px={{ base: 1, sm: 2, md: 4 }}
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                >
                  <Text fontSize={{ base: "lg", sm: "xl", md: "2xl" }} mb={1}>📱</Text>
                  <Text 
                    fontSize={{ base: "2xs", sm: "xs", md: "md" }}
                    fontWeight="bold"
                    mb={{ base: 0.5, md: 2 }}
                  >
                    멀티 플랫폼
                  </Text>
                  <Text 
                    color="gray.600" 
                    fontSize={{ base: "3xs", sm: "2xs", md: "sm" }}
                    display={{ base: "none", sm: "block" }}
                    lineHeight="1.3"
                  >
                    트위터부터 블로그까지 모든 SNS 대응
                  </Text>
                </CardBody>
              </Card>

              {/* 즉시 생성 */}
              <Card 
                shadow="sm"
                borderRadius="lg"
                h="full"
              >
                <CardBody 
                  textAlign="center" 
                  py={{ base: 3, sm: 4, md: 6 }} 
                  px={{ base: 1, sm: 2, md: 4 }}
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                >
                  <Text fontSize={{ base: "lg", sm: "xl", md: "2xl" }} mb={1}>⚡</Text>
                  <Text 
                    fontSize={{ base: "2xs", sm: "xs", md: "md" }}
                    fontWeight="bold"
                    mb={{ base: 0.5, md: 2 }}
                  >
                    빠른 생성
                  </Text>
                  <Text 
                    color="gray.600" 
                    fontSize={{ base: "3xs", sm: "2xs", md: "sm" }}
                    display={{ base: "none", sm: "block" }}
                    lineHeight="1.3"
                  >
                    주제 입력 후 3초만에 완성된 콘텐츠
                  </Text>
                </CardBody>
              </Card>
            </SimpleGrid>
          </Box>
        </VStack>
      </Container>
    </Layout>
  )
}
