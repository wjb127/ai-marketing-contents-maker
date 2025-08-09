'use client'

import React, { useState, useEffect } from 'react'
import { 
  VStack, 
  Text, 
  Badge, 
  HStack,
  Box,
  Tooltip,
  Icon
} from '@chakra-ui/react'
import { TimeIcon, WarningIcon } from '@chakra-ui/icons'

interface ScheduleCountdownProps {
  nextRunAt: string
  frequency: string
  timeOfDay: string
  isActive: boolean
}

export const ScheduleCountdown: React.FC<ScheduleCountdownProps> = ({
  nextRunAt,
  frequency,
  timeOfDay,
  isActive
}) => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000) // 매초 업데이트

    return () => clearInterval(timer)
  }, [])

  if (!isClient) {
    return null // SSR 방지
  }

  // 시간 처리 및 자동 보정 로직
  const nowKST = currentTime // 현재 시간은 그대로 사용
  const nextRunKST = new Date(nextRunAt) // DB에서 온 시간은 올바르게 파싱됨
  
  // UTC-KST 변환 오류 자동 감지 및 보정 (9시간 차이 패턴)
  const timeDiffHours = (nextRunKST.getTime() - nowKST.getTime()) / (1000 * 60 * 60)
  let nextRunKSTLocal = nextRunKST
  
  // 시간 차이가 8-10시간 범위에 있고, 현재 시간보다 미래인 경우 9시간 빼서 보정
  if (timeDiffHours > 8 && timeDiffHours < 10 && nextRunKST > nowKST) {
    console.log('🔧 Detected 9-hour timezone offset, applying correction:', {
      original: nextRunKST.toLocaleString('ko-KR'),
      corrected: new Date(nextRunKST.getTime() - 9 * 60 * 60 * 1000).toLocaleString('ko-KR')
    })
    nextRunKSTLocal = new Date(nextRunKST.getTime() - 9 * 60 * 60 * 1000) // 9시간 빼기
  }

  // 시간 차이 계산 (밀리초)
  const timeDiff = nextRunKSTLocal.getTime() - nowKST.getTime()
  const isPast = timeDiff <= 0

  // 시간 단위로 변환
  const days = Math.floor(Math.abs(timeDiff) / (1000 * 60 * 60 * 24))
  const hours = Math.floor((Math.abs(timeDiff) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((Math.abs(timeDiff) % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((Math.abs(timeDiff) % (1000 * 60)) / 1000)

  // 상태 결정
  const getStatus = () => {
    if (!isActive) return { color: 'gray', text: '비활성', icon: null, pulse: false }
    if (isPast) return { color: 'yellow', text: '지난 시간', icon: WarningIcon, pulse: false }
    if (timeDiff <= 1 * 60 * 1000) return { color: 'red', text: '1분 이내!', icon: WarningIcon, pulse: true } // 1분 이내
    if (timeDiff <= 5 * 60 * 1000) return { color: 'red', text: '5분 이내', icon: WarningIcon, pulse: true } // 5분 이내
    if (timeDiff <= 15 * 60 * 1000) return { color: 'orange', text: '15분 이내', icon: TimeIcon, pulse: false } // 15분 이내
    if (timeDiff <= 30 * 60 * 1000) return { color: 'orange', text: '30분 이내', icon: TimeIcon, pulse: false } // 30분 이내
    if (timeDiff <= 60 * 60 * 1000) return { color: 'blue', text: '1시간 이내', icon: TimeIcon, pulse: false } // 1시간 이내
    return { color: 'green', text: '대기 중', icon: TimeIcon, pulse: false }
  }

  const status = getStatus()

  // 시간 포맷팅 - 로컬 시간대 사용
  const formatCurrentTime = (date: Date) => {
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  const formatNextRun = (date: Date) => {
    return date.toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const getTimeUntilText = () => {
    if (!isActive) return ''
    if (isPast) return '다음 실행 시간이 지났습니다'
    
    let text = ''
    if (days > 0) text += `${days}일 `
    if (hours > 0) text += `${hours}시간 `
    if (minutes > 0) text += `${minutes}분 `
    if (days === 0 && hours === 0) text += `${seconds}초 `
    
    return text + '남음'
  }

  return (
    <Box>
      {/* 현재 시간 */}
      <HStack spacing={2} mb={2} fontSize="xs" color="gray.500">
        <Icon as={TimeIcon} />
        <Text>현재: {formatCurrentTime(nowKST)}</Text>
      </HStack>

      {/* 다음 실행 시간 */}
      <HStack spacing={2} mb={2} fontSize="sm">
        <Text color="gray.600">
          <strong>다음 실행:</strong> {formatNextRun(nextRunKSTLocal)}
        </Text>
        <Tooltip label={`빈도: ${frequency}, 시간: ${timeOfDay}`}>
          <Badge 
            colorScheme={status.color} 
            variant={status.pulse ? "solid" : "subtle"}
            sx={status.pulse ? {
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.5 }
              }
            } : {}}
          >
            {status.icon && <Icon as={status.icon} mr={1} />}
            {status.text}
          </Badge>
        </Tooltip>
      </HStack>

      {/* 카운트다운 */}
      {isActive && (
        <Box
          p={2}
          bg={status.pulse ? "red.50" : "blue.50"}
          borderRadius="md"
          border="1px"
          borderColor={status.pulse ? "red.200" : "blue.200"}
        >
          <Text 
            fontSize="sm" 
            color={isPast ? "yellow.700" : timeDiff <= 5 * 60 * 1000 ? "red.700" : "blue.700"}
            fontWeight="semibold"
            textAlign="center"
          >
            ⏰ {getTimeUntilText()}
          </Text>
        </Box>
      )}
    </Box>
  )
}