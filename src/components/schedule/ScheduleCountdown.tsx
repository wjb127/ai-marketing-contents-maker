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

  // 시간 처리 - 저장 시점에서 이미 보정됨
  const nowKST = currentTime // 현재 시간은 그대로 사용
  let nextRunKST = new Date(nextRunAt) // DB에서 온 시간은 이미 보정되어 저장됨
  
  // 스케줄 시간이 지났으면 다음 실행 시간 계산
  if (nextRunKST.getTime() <= nowKST.getTime() && isActive) {
    // calculateNextRun 함수를 사용하여 다음 실행 시간 계산
    const [hours, minutes] = timeOfDay.split(':').map(Number)
    const now = new Date()
    
    switch (frequency) {
      case 'daily':
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(hours, minutes, 0, 0)
        // -9시간 보정 적용 (저장 시와 동일한 보정)
        nextRunKST = new Date(tomorrow.getTime() - 9 * 60 * 60 * 1000)
        break
        
      case 'weekly':
        const nextWeek = new Date(now)
        const daysUntilMonday = (8 - nextWeek.getDay()) % 7 || 7
        nextWeek.setDate(nextWeek.getDate() + daysUntilMonday)
        nextWeek.setHours(hours, minutes, 0, 0)
        // -9시간 보정 적용
        nextRunKST = new Date(nextWeek.getTime() - 9 * 60 * 60 * 1000)
        break
        
      case 'monthly':
        const nextMonth = new Date(now)
        nextMonth.setMonth(nextMonth.getMonth() + 1, 1)
        nextMonth.setHours(hours, minutes, 0, 0)
        // -9시간 보정 적용
        nextRunKST = new Date(nextMonth.getTime() - 9 * 60 * 60 * 1000)
        break
        
      case 'hourly':
        const nextHour = new Date(now)
        nextHour.setMinutes(minutes, 0, 0)
        if (nextHour <= now) {
          nextHour.setHours(nextHour.getHours() + 1)
        }
        // -9시간 보정 적용
        nextRunKST = new Date(nextHour.getTime() - 9 * 60 * 60 * 1000)
        break
        
      case '3hours':
        const next3Hours = new Date(now)
        next3Hours.setMinutes(minutes, 0, 0)
        const currentHour3 = next3Hours.getHours()
        const next3HourSlot = Math.ceil(currentHour3 / 3) * 3
        next3Hours.setHours(next3HourSlot)
        if (next3Hours <= now) {
          next3Hours.setHours(next3Hours.getHours() + 3)
        }
        // -9시간 보정 적용
        nextRunKST = new Date(next3Hours.getTime() - 9 * 60 * 60 * 1000)
        break
        
      case '6hours':
        const next6Hours = new Date(now)
        next6Hours.setMinutes(minutes, 0, 0)
        const currentHour6 = next6Hours.getHours()
        const next6HourSlot = Math.ceil(currentHour6 / 6) * 6
        next6Hours.setHours(next6HourSlot)
        if (next6Hours <= now) {
          next6Hours.setHours(next6Hours.getHours() + 6)
        }
        // -9시간 보정 적용
        nextRunKST = new Date(next6Hours.getTime() - 9 * 60 * 60 * 1000)
        break
    }
  }
  
  const nextRunKSTLocal = nextRunKST // 추가 변환 없이 그대로 사용

  // 시간 차이 계산 (밀리초)
  const timeDiff = nextRunKSTLocal.getTime() - nowKST.getTime()
  const isPast = timeDiff <= 0 && !isActive // 비활성 상태일 때만 과거로 판단

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
    // 활성 스케줄은 항상 다음 실행 시간까지의 카운트다운 표시
    
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