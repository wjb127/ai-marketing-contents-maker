'use client'

import React, { useState, useEffect } from 'react'
import { Box, Text, HStack, VStack, Icon, Badge } from '@chakra-ui/react'
import { TimeIcon } from '@chakra-ui/icons'

export const GlobalClock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  if (!isClient) {
    return (
      <HStack spacing={2}>
        <Icon as={TimeIcon} color="blue.500" />
        <Text fontSize="sm" color="gray.600">
          현재 시간 로딩 중...
        </Text>
      </HStack>
    )
  }

  // 한국 시간으로 변환 (+3시간 보정)
  const nowKST = new Date(currentTime.getTime() + 3 * 60 * 60 * 1000)
  
  const formatCurrentTime = (date: Date) => {
    return date.toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  // 현재 시간대에 따른 상태
  const getTimeStatus = () => {
    const hour = nowKST.getHours()
    if (hour >= 6 && hour < 12) return { color: 'yellow', text: '오전' }
    if (hour >= 12 && hour < 18) return { color: 'orange', text: '오후' }
    if (hour >= 18 && hour < 22) return { color: 'purple', text: '저녁' }
    return { color: 'blue', text: '밤' }
  }

  const status = getTimeStatus()

  return (
    <HStack spacing={3} bg="gray.50" p={3} borderRadius="md" border="1px" borderColor="gray.200">
      <Icon as={TimeIcon} color="blue.500" />
      <VStack align="start" spacing={0}>
        <HStack spacing={2}>
          <Text fontSize="md" fontWeight="semibold" color="gray.800">
            {formatCurrentTime(nowKST)} KST
          </Text>
          <Badge colorScheme={status.color} variant="subtle">
            {status.text}
          </Badge>
        </HStack>
        <Text fontSize="xs" color="gray.500">
          스케줄은 한국 표준시(KST) 기준으로 실행됩니다
        </Text>
      </VStack>
    </HStack>
  )
}