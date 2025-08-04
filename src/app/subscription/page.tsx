'use client'

import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Grid,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Progress,
  HStack,
  Divider,
  Spinner,
  Center,
} from '@chakra-ui/react'
import { useState } from 'react'
import Layout from '@/components/layout/Layout'
import SubscriptionManager from '@/components/subscription/SubscriptionManager'
import { useAuth } from '@/hooks/useAuth'
import { useUser } from '@/hooks/useUser'
import { PLAN_LIMITS, SUBSCRIPTION_PLANS } from '@/utils/constants'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function SubscriptionPage() {
  const { user: authUser } = useAuth()
  const { user, loading: userLoading } = useUser()
  
  const userPlan = user?.subscription_plan || 'free'
  const currentPlanData = SUBSCRIPTION_PLANS.find(plan => plan.id === userPlan)
  const planLimits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS]
  
  const usageData = {
    contentGenerated: user?.monthly_content_count || 0,
    schedulesUsed: 1, // This would come from schedules count
    subscriptionEndDate: user?.subscription_end_date ? new Date(user.subscription_end_date) : null,
  }

  const contentUsagePercentage = planLimits.maxContentPerMonth === -1 
    ? 0 
    : (usageData.contentGenerated / planLimits.maxContentPerMonth) * 100

  const scheduleUsagePercentage = planLimits.maxSchedules === -1 
    ? 0 
    : (usageData.schedulesUsed / planLimits.maxSchedules) * 100

  if (userLoading) {
    return (
      <ProtectedRoute>
        <Layout>
          <Center py={20}>
            <VStack spacing={4}>
              <Spinner size="xl" color="brand.500" />
              <Text>사용자 정보를 불러오는 중...</Text>
            </VStack>
          </Center>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading size="xl" mb={2}>
              구독 관리
            </Heading>
            <Text color="gray.600" fontSize="lg">
              현재 구독 상태를 확인하고 플랜을 관리하세요
            </Text>
          </Box>

          {/* Current Subscription Status */}
          <Card>
            <CardHeader>
              <Heading size="md">현재 구독 정보</Heading>
            </CardHeader>
            <CardBody>
              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
                <VStack align="start" spacing={4}>
                  <Box>
                    <HStack spacing={3} mb={2}>
                      <Text fontWeight="bold" fontSize="lg">
                        {currentPlanData?.name} Plan
                      </Text>
                      <Badge 
                        colorScheme={userPlan === 'free' ? 'gray' : user?.subscription_status === 'active' ? 'green' : 'red'} 
                        size="lg"
                      >
                        {userPlan === 'free' ? 'FREE' : (user?.subscription_status || 'INACTIVE').toUpperCase()}
                      </Badge>
                    </HStack>
                    <Text color="gray.600">
                      {userPlan === 'free' 
                        ? '무료 플랜을 사용 중입니다' 
                        : `월 ₩${(currentPlanData?.price || 0) * 1000} 구독 중`
                      }
                    </Text>
                  </Box>

                  {userPlan !== 'free' && usageData.subscriptionEndDate && (
                    <Box>
                      <Text fontWeight="semibold" mb={1}>구독 만료일</Text>
                      <Text color="gray.600">
                        {usageData.subscriptionEndDate.toLocaleDateString('ko-KR')}
                      </Text>
                    </Box>
                  )}
                </VStack>

                <VStack align="start" spacing={4}>
                  <Box width="100%">
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="semibold">콘텐츠 생성</Text>
                      <Text fontSize="sm" color="gray.600">
                        {usageData.contentGenerated} / {
                          planLimits.maxContentPerMonth === -1 
                            ? '무제한' 
                            : planLimits.maxContentPerMonth
                        }
                      </Text>
                    </HStack>
                    <Progress 
                      value={contentUsagePercentage} 
                      colorScheme={contentUsagePercentage > 80 ? 'orange' : 'brand'}
                      size="lg"
                    />
                  </Box>

                  <Box width="100%">
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="semibold">자동 스케줄</Text>
                      <Text fontSize="sm" color="gray.600">
                        {usageData.schedulesUsed} / {
                          planLimits.maxSchedules === -1 
                            ? '무제한' 
                            : planLimits.maxSchedules
                        }
                      </Text>
                    </HStack>
                    <Progress 
                      value={scheduleUsagePercentage} 
                      colorScheme={scheduleUsagePercentage > 80 ? 'orange' : 'brand'}
                      size="lg"
                    />
                  </Box>
                </VStack>
              </Grid>
            </CardBody>
          </Card>

          <Divider />

          {/* Available Plans */}
          <SubscriptionManager />
        </VStack>
      </Layout>
    </ProtectedRoute>
  )
}