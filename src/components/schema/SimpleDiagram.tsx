'use client'

import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Badge,
  useColorModeValue,
  Flex,
  Divider
} from '@chakra-ui/react'
import { ArrowDown, ArrowRight, Database, Users, FileText, Calendar, CreditCard } from 'lucide-react'

interface SimpleDiagramProps {
  type: 'erd' | 'flowchart' | 'dataflow'
}

export default function SimpleDiagram({ type }: SimpleDiagramProps) {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  if (type === 'erd') {
    return (
      <VStack spacing={6} align="stretch">
        {/* Users Table */}
        <Card bg="blue.50" borderColor="blue.200" border="2px solid">
          <CardBody>
            <VStack spacing={3} align="start">
              <Flex align="center">
                <Users size={20} color="#3182CE" />
                <Text fontWeight="bold" ml={2} color="blue.700">USERS</Text>
              </Flex>
              <VStack spacing={1} align="start" fontSize="sm">
                <Text><Badge colorScheme="yellow">PK</Badge> id (UUID)</Text>
                <Text>email (TEXT)</Text>
                <Text>subscription_plan (ENUM)</Text>
                <Text>subscription_status (ENUM)</Text>
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Arrow */}
        <Flex justify="center">
          <ArrowDown size={24} color="#4A5568" />
        </Flex>

        {/* Middle Tables */}
        <HStack spacing={6} align="stretch">
          {/* Contents */}
          <Card bg="purple.50" borderColor="purple.200" border="2px solid" flex={1}>
            <CardBody>
              <VStack spacing={3} align="start">
                <Flex align="center">
                  <FileText size={20} color="#7B1FA2" />
                  <Text fontWeight="bold" ml={2} color="purple.700">CONTENTS</Text>
                </Flex>
                <VStack spacing={1} align="start" fontSize="sm">
                  <Text><Badge colorScheme="yellow">PK</Badge> id (UUID)</Text>
                  <Text><Badge colorScheme="blue">FK</Badge> user_id (UUID)</Text>
                  <Text>content_type (ENUM)</Text>
                  <Text>status (ENUM)</Text>
                </VStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Schedules */}
          <Card bg="green.50" borderColor="green.200" border="2px solid" flex={1}>
            <CardBody>
              <VStack spacing={3} align="start">
                <Flex align="center">
                  <Calendar size={20} color="#388E3C" />
                  <Text fontWeight="bold" ml={2} color="green.700">SCHEDULES</Text>
                </Flex>
                <VStack spacing={1} align="start" fontSize="sm">
                  <Text><Badge colorScheme="yellow">PK</Badge> id (UUID)</Text>
                  <Text><Badge colorScheme="blue">FK</Badge> user_id (UUID)</Text>
                  <Text>frequency (ENUM)</Text>
                  <Text>is_active (BOOL)</Text>
                </VStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Payments */}
          <Card bg="orange.50" borderColor="orange.200" border="2px solid" flex={1}>
            <CardBody>
              <VStack spacing={3} align="start">
                <Flex align="center">
                  <CreditCard size={20} color="#F57C00" />
                  <Text fontWeight="bold" ml={2} color="orange.700">PAYMENTS</Text>
                </Flex>
                <VStack spacing={1} align="start" fontSize="sm">
                  <Text><Badge colorScheme="yellow">PK</Badge> id (UUID)</Text>
                  <Text><Badge colorScheme="blue">FK</Badge> user_id (UUID)</Text>
                  <Text>amount (INT)</Text>
                  <Text>status (TEXT)</Text>
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        </HStack>

        {/* Relationship between Schedules and Contents */}
        <Flex justify="center" align="center" direction="column">
          <Box w="2px" h="40px" bg="gray.400" />
          <Text fontSize="sm" color="gray.600" bg={bgColor} px={2}>
            SCHEDULES → CONTENTS (generates)
          </Text>
        </Flex>
      </VStack>
    )
  }

  if (type === 'flowchart') {
    return (
      <VStack spacing={8}>
        {/* Top */}
        <Card bg="blue.50" borderColor="blue.200" border="2px solid" textAlign="center" p={4}>
          <Text fontWeight="bold" color="blue.700">👤 USERS</Text>
          <Text fontSize="sm" color="blue.600">구독 정보 관리</Text>
        </Card>

        {/* Arrow */}
        <ArrowDown size={24} color="#4A5568" />

        {/* Bottom Row */}
        <HStack spacing={8}>
          <VStack spacing={4}>
            <Card bg="purple.50" borderColor="purple.200" border="2px solid" textAlign="center" p={4}>
              <Text fontWeight="bold" color="purple.700">📝 CONTENTS</Text>
              <Text fontSize="sm" color="purple.600">AI 생성 콘텐츠</Text>
            </Card>
          </VStack>

          <VStack spacing={4}>
            <Card bg="green.50" borderColor="green.200" border="2px solid" textAlign="center" p={4}>
              <Text fontWeight="bold" color="green.700">⏰ SCHEDULES</Text>
              <Text fontSize="sm" color="green.600">자동 생성 설정</Text>
            </Card>
          </VStack>

          <VStack spacing={4}>
            <Card bg="orange.50" borderColor="orange.200" border="2px solid" textAlign="center" p={4}>
              <Text fontWeight="bold" color="orange.700">💳 PAYMENTS</Text>
              <Text fontSize="sm" color="orange.600">구독 결제 내역</Text>
            </Card>
          </VStack>
        </HStack>

        {/* Bottom Connection */}
        <HStack spacing={4} align="center">
          <Text fontSize="sm" color="gray.600">SCHEDULES</Text>
          <ArrowRight size={20} color="#4A5568" />
          <Text fontSize="sm" color="gray.600">CONTENTS</Text>
        </HStack>
      </VStack>
    )
  }

  if (type === 'dataflow') {
    return (
      <VStack spacing={6} align="stretch">
        {/* Flow Steps */}
        <Card bg="blue.50" border="2px solid" borderColor="blue.200" p={4}>
          <Text fontWeight="bold" color="blue.700">👤 새 사용자 가입</Text>
        </Card>

        <Flex justify="center">
          <ArrowDown size={24} color="#4A5568" />
        </Flex>

        <Card bg="purple.50" border="2px solid" borderColor="purple.200" p={4}>
          <Text fontWeight="bold" color="purple.700">📝 콘텐츠 생성 요청</Text>
        </Card>

        <Flex justify="center">
          <ArrowDown size={24} color="#4A5568" />
        </Flex>

        <Card bg="orange.50" border="2px solid" borderColor="orange.200" p={4}>
          <VStack spacing={2}>
            <Text fontWeight="bold" color="orange.700">💳 구독 플랜 확인</Text>
            <HStack spacing={4} fontSize="sm">
              <Badge colorScheme="green">Free: 10개/월</Badge>
              <Badge colorScheme="blue">Pro: 100개/월</Badge>
              <Badge colorScheme="purple">Premium: 무제한</Badge>
            </HStack>
          </VStack>
        </Card>

        <HStack spacing={6}>
          <VStack flex={1} spacing={4}>
            <Text fontSize="sm" color="gray.600">한도 초과 시</Text>
            <ArrowDown size={20} color="#4A5568" />
            <Card bg="red.50" border="2px solid" borderColor="red.200" p={4} w="full">
              <Text fontWeight="bold" color="red.700">💰 결제 페이지</Text>
            </Card>
          </VStack>

          <VStack flex={1} spacing={4}>
            <Text fontSize="sm" color="gray.600">한도 내일 시</Text>
            <ArrowDown size={20} color="#4A5568" />
            <Card bg="green.50" border="2px solid" borderColor="green.200" p={4} w="full">
              <Text fontWeight="bold" color="green.700">✅ 콘텐츠 생성</Text>
            </Card>
          </VStack>
        </HStack>

        <Flex justify="center">
          <ArrowDown size={24} color="#4A5568" />
        </Flex>

        <Card bg="teal.50" border="2px solid" borderColor="teal.200" p={4}>
          <VStack spacing={2}>
            <Text fontWeight="bold" color="teal.700">⏰ 스케줄 설정 (선택사항)</Text>
            <Text fontSize="sm" color="teal.600">QStash를 통한 자동 콘텐츠 생성</Text>
          </VStack>
        </Card>
      </VStack>
    )
  }

  return null
}