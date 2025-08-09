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
  Badge,
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
              <Box as="span" position="relative" display="inline-block">
                <Text 
                  as="span" 
                  bgGradient="linear(135deg, #667eea 0%, #764ba2 100%)"
                  bgClip="text"
                  fontWeight="black"
                  position="relative"
                  _after={{
                    content: '""',
                    position: "absolute",
                    bottom: "-4px",
                    left: "0",
                    right: "0",
                    height: "4px",
                    background: "linear-gradient(135deg, #667eea, #764ba2)",
                    borderRadius: "2px",
                    animation: "shimmer 2s infinite"
                  }}
                  sx={{
                    "@keyframes shimmer": {
                      "0%": { transform: "translateX(-100%)" },
                      "100%": { transform: "translateX(100%)" }
                    }
                  }}
                >
                  클리셰에 맞는 SNS 콘텐츠
                </Text>
                <Box
                  position="absolute"
                  top="-8px"
                  right="-12px"
                  fontSize="lg"
                  animation="bounce 1.5s infinite"
                  sx={{
                    "@keyframes bounce": {
                      "0%, 100%": { transform: "translateY(0)" },
                      "50%": { transform: "translateY(-4px)" }
                    }
                  }}
                >
                  ⭐
                </Box>
              </Box>
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
              {/* 핵심 경쟁력: 클리셰 기반 생성 */}
              <Card 
                shadow="xl"
                borderRadius="xl"
                h="full"
                position="relative"
                overflow="hidden"
                bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                color="white"
                transform="scale(1.05)"
                _before={{
                  content: '""',
                  position: "absolute",
                  top: -2,
                  left: -2,
                  right: -2,
                  bottom: -2,
                  background: "linear-gradient(135deg, #667eea, #764ba2, #f093fb, #f5576c)",
                  borderRadius: "xl",
                  zIndex: -1,
                  filter: "blur(6px)",
                  opacity: 0.6,
                }}
                animation="pulse 3s infinite"
                sx={{
                  "@keyframes pulse": {
                    "0%, 100%": { transform: "scale(1.05)" },
                    "50%": { transform: "scale(1.08)" }
                  }
                }}
              >
                <CardBody 
                  textAlign="center" 
                  py={{ base: 4, sm: 5, md: 7 }} 
                  px={{ base: 2, sm: 3, md: 5 }}
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  position="relative"
                >
                  <Box
                    fontSize={{ base: "xl", sm: "2xl", md: "3xl" }} 
                    mb={2}
                    animation="sparkle 2s infinite"
                    sx={{
                      "@keyframes sparkle": {
                        "0%, 100%": { transform: "rotate(0deg) scale(1)" },
                        "25%": { transform: "rotate(-10deg) scale(1.1)" },
                        "75%": { transform: "rotate(10deg) scale(1.1)" }
                      }
                    }}
                  >
                    ✨
                  </Box>
                  <VStack spacing={1}>
                    <HStack justify="center" spacing={1}>
                      <Text 
                        fontSize={{ base: "xs", sm: "sm", md: "lg" }}
                        fontWeight="bold"
                        color="white"
                      >
                        클리셰 기반
                      </Text>
                      <Badge 
                        colorScheme="yellow" 
                        variant="solid" 
                        size="sm"
                        borderRadius="full"
                        animation="glow 2s infinite alternate"
                        sx={{
                          "@keyframes glow": {
                            "0%": { boxShadow: "0 0 5px rgba(255, 215, 0, 0.5)" },
                            "100%": { boxShadow: "0 0 15px rgba(255, 215, 0, 0.8)" }
                          }
                        }}
                      >
                        🏆
                      </Badge>
                    </HStack>
                    <Text 
                      color="whiteAlpha.900" 
                      fontSize={{ base: "2xs", sm: "xs", md: "sm" }}
                      display={{ base: "none", sm: "block" }}
                      lineHeight="1.4"
                      fontWeight="medium"
                    >
                      검증된 SNS 패턴으로<br />즉시 통하는 콘텐츠
                    </Text>
                  </VStack>
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
