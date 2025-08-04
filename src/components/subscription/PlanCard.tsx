'use client'

import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  List,
  ListItem,
  ListIcon,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react'
import { CheckIcon } from '@chakra-ui/icons'
import { SubscriptionPlan } from '@/types'
import { PLAN_LIMITS } from '@/utils/constants'
import TossPayment from '@/components/payment/TossPayment'

interface PlanCardProps {
  plan: SubscriptionPlan
  isCurrentPlan?: boolean
  isPopular?: boolean
  onSelect?: (planId: string) => void
}

export default function PlanCard({ 
  plan, 
  isCurrentPlan = false, 
  isPopular = false,
  onSelect 
}: PlanCardProps) {
  const planLimits = PLAN_LIMITS[plan.id as keyof typeof PLAN_LIMITS]
  
  const borderColor = useColorModeValue(
    isCurrentPlan ? 'brand.500' : 'gray.200',
    isCurrentPlan ? 'brand.300' : 'gray.600'
  )
  
  const bgColor = useColorModeValue(
    isPopular ? 'brand.50' : 'white',
    isPopular ? 'brand.900' : 'gray.800'
  )

  return (
    <Card
      borderWidth={2}
      borderColor={borderColor}
      bg={bgColor}
      position="relative"
      _hover={{
        transform: 'translateY(-4px)',
        shadow: 'lg',
      }}
      transition="all 0.2s"
    >
      {isPopular && (
        <Badge
          position="absolute"
          top="-10px"
          left="50%"
          transform="translateX(-50%)"
          colorScheme="brand"
          variant="solid"
          px={3}
          py={1}
          borderRadius="full"
        >
          Most Popular
        </Badge>
      )}
      
      <CardHeader textAlign="center" pb={4}>
        <Heading size="lg" mb={2}>
          {plan.name}
        </Heading>
        <HStack justify="center" spacing={1}>
          <Text fontSize="3xl" fontWeight="bold">
            ₩{plan.price * 1000}
          </Text>
          <Text color="gray.500">/month</Text>
        </HStack>
        <Text fontSize="sm" color="gray.600" textAlign="center">
          {plan.description}
        </Text>
      </CardHeader>
      
      <CardBody pt={0}>
        <VStack spacing={6}>
          <List spacing={3} w="100%">
            {plan.features.map((feature, index) => (
              <ListItem key={index} display="flex" alignItems="center">
                <ListIcon as={CheckIcon} color="green.500" />
                <Text>{feature}</Text>
              </ListItem>
            ))}
            
            {planLimits && (
              <>
                <ListItem display="flex" alignItems="center">
                  <ListIcon as={CheckIcon} color="green.500" />
                  <Text>
                    {planLimits.maxSchedules === -1 
                      ? '무제한 스케줄' 
                      : `${planLimits.maxSchedules}개 스케줄`
                    }
                  </Text>
                </ListItem>
                
                <ListItem display="flex" alignItems="center">
                  <ListIcon as={CheckIcon} color="green.500" />
                  <Text>
                    {planLimits.maxContentPerMonth === -1 
                      ? '무제한 콘텐츠 생성' 
                      : `월 ${planLimits.maxContentPerMonth}개 콘텐츠`
                    }
                  </Text>
                </ListItem>
                
                {planLimits.autoGeneration && (
                  <ListItem display="flex" alignItems="center">
                    <ListIcon as={CheckIcon} color="green.500" />
                    <Text>자동 생성 및 스케줄링</Text>
                  </ListItem>
                )}
              </>
            )}
          </List>

          {isCurrentPlan ? (
            <Button
              colorScheme="gray"
              variant="outline"
              size="lg"
              width="100%"
              isDisabled
            >
              현재 플랜
            </Button>
          ) : plan.price === 0 ? (
            <Button
              colorScheme="brand"
              variant="outline"
              size="lg"
              width="100%"
              onClick={() => onSelect?.(plan.id)}
            >
              무료 플랜 선택
            </Button>
          ) : (
            <TossPayment 
              plan={plan} 
              onSuccess={() => onSelect?.(plan.id)}
            />
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}