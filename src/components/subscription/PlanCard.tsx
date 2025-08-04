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
            ${plan.price}
          </Text>
          <Text color="gray.500">/month</Text>
        </HStack>
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
            
            <ListItem display="flex" alignItems="center">
              <ListIcon as={CheckIcon} color="green.500" />
              <Text>
                {plan.max_schedules === -1 
                  ? 'Unlimited schedules' 
                  : `${plan.max_schedules} schedule${plan.max_schedules > 1 ? 's' : ''}`
                }
              </Text>
            </ListItem>
            
            <ListItem display="flex" alignItems="center">
              <ListIcon as={CheckIcon} color="green.500" />
              <Text>
                {plan.max_content_per_month === -1 
                  ? 'Unlimited content generation' 
                  : `${plan.max_content_per_month} content pieces/month`
                }
              </Text>
            </ListItem>
            
            {plan.auto_generation && (
              <ListItem display="flex" alignItems="center">
                <ListIcon as={CheckIcon} color="green.500" />
                <Text>Auto-generation & scheduling</Text>
              </ListItem>
            )}
            
            {plan.priority_support && (
              <ListItem display="flex" alignItems="center">
                <ListIcon as={CheckIcon} color="green.500" />
                <Text>Priority support</Text>
              </ListItem>
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
              Current Plan
            </Button>
          ) : plan.price === 0 ? (
            <Button
              colorScheme="brand"
              variant="outline"
              size="lg"
              width="100%"
              onClick={() => onSelect?.(plan.id)}
            >
              Choose Free Plan
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