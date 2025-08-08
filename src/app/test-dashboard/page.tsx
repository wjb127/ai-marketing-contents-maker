'use client'

import { useState, useEffect } from 'react'
import { Box, Button, VStack, HStack, Text, Badge, Heading, Container, Code, useToast } from '@chakra-ui/react'

export default function TestDashboard() {
  const [currentTime, setCurrentTime] = useState('')
  const [executions, setExecutions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  // 현재 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
      setCurrentTime(kst.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 실행 로그 조회
  const fetchExecutions = async () => {
    try {
      const res = await fetch('/api/test/time-logger')
      const data = await res.json()
      setExecutions(data.recentExecutions || [])
    } catch (error) {
      console.error('Failed to fetch executions:', error)
    }
  }

  // 자동 새로고침
  useEffect(() => {
    fetchExecutions()
    const interval = setInterval(fetchExecutions, 5000) // 5초마다
    return () => clearInterval(interval)
  }, [])

  // 1분 후 스케줄 생성
  const createSchedule = async () => {
    setLoading(true)
    try {
      const now = new Date()
      const oneMinuteLater = new Date(now.getTime() + 60 * 1000)
      const kstTime = new Date(oneMinuteLater.getTime() + 9 * 60 * 60 * 1000)
      const timeString = `${kstTime.getHours().toString().padStart(2, '0')}:${kstTime.getMinutes().toString().padStart(2, '0')}`
      
      const res = await fetch('/api/schedule/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `테스트 ${timeString}`,
          content_type: 'x_post',
          content_tone: 'casual',
          topic: '시간 테스트',
          target_audience: '테스터',
          additional_instructions: '1분 후 실행',
          frequency: 'daily',
          time_of_day: timeString,
          timezone: 'Asia/Seoul'
        })
      })
      
      const data = await res.json()
      
      toast({
        title: '스케줄 생성 완료',
        description: `${timeString}에 실행 예정 (ID: ${data.id?.slice(0, 8)}...)`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: '스케줄 생성 실패',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        <Box bg="blue.50" p={6} borderRadius="lg">
          <Heading size="lg" mb={4}>🕐 QStash 스케줄 테스트 대시보드</Heading>
          <Text fontSize="2xl" fontWeight="bold">
            현재 시간 (KST): {currentTime}
          </Text>
        </Box>

        <Box bg="white" p={6} borderRadius="lg" shadow="md">
          <HStack justify="space-between" mb={4}>
            <Heading size="md">테스트 컨트롤</Heading>
            <Button 
              colorScheme="blue" 
              onClick={createSchedule}
              isLoading={loading}
            >
              1분 후 실행될 스케줄 생성
            </Button>
          </HStack>
          <Text color="gray.600">
            버튼을 클릭하면 1분 후에 실행될 스케줄이 생성됩니다.
          </Text>
        </Box>

        <Box bg="white" p={6} borderRadius="lg" shadow="md">
          <HStack justify="space-between" mb={4}>
            <Heading size="md">최근 실행 기록</Heading>
            <Badge colorScheme={executions.length > 0 ? 'green' : 'gray'}>
              {executions.length}개
            </Badge>
          </HStack>
          
          {executions.length === 0 ? (
            <Text color="gray.500">아직 실행된 스케줄이 없습니다...</Text>
          ) : (
            <VStack align="stretch" spacing={3}>
              {executions.map((exec, idx) => (
                <Box key={idx} p={3} bg="gray.50" borderRadius="md">
                  <HStack justify="space-between">
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold">{exec.message}</Text>
                      <Text fontSize="sm" color="gray.600">
                        실행 시간: {exec.readableKST}
                      </Text>
                    </VStack>
                    <Code>{exec.scheduleId?.slice(0, 8)}...</Code>
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </Box>

        <Box bg="yellow.50" p={4} borderRadius="md">
          <Text fontSize="sm" color="gray.700">
            💡 5초마다 자동으로 새로고침됩니다. 스케줄이 실행되면 여기에 표시됩니다.
          </Text>
        </Box>
      </VStack>
    </Container>
  )
}