'use client'

import {
  Box,
  Grid,
  Heading,
  Text,
  VStack,
  useToast,
  Alert,
  AlertIcon,
  Button,
  HStack,
  Badge,
} from '@chakra-ui/react'
import { useState } from 'react'
import { SubscriptionPlan } from '@/types'
import PlanCard from './PlanCard'
import { useAuth } from '@/hooks/useAuth'

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: [
      'X Posts and LinkedIn Posts',
      'Manual content generation',
      'Basic templates',
      'Email support',
    ],
    max_schedules: 1,
    max_content_per_month: 10,
    auto_generation: false,
    priority_support: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    features: [
      'All content types',
      'Auto-generation & scheduling',
      'Advanced templates',
      'Analytics dashboard',
      'Custom prompts',
    ],
    max_schedules: 5,
    max_content_per_month: 100,
    auto_generation: true,
    priority_support: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 79,
    features: [
      'Everything in Pro',
      'Unlimited content generation',
      'Priority support',
      'Custom integrations',
      'Advanced analytics',
      'White-label options',
    ],
    max_schedules: -1,
    max_content_per_month: -1,
    auto_generation: true,
    priority_support: true,
  },
]

interface SubscriptionManagerProps {
  showUpgradeOnly?: boolean
}

export default function SubscriptionManager({ showUpgradeOnly = false }: SubscriptionManagerProps) {
  const { user } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()

  const currentPlan = user?.user_metadata?.subscription_plan || 'free'
  const currentPlanData = SUBSCRIPTION_PLANS.find(plan => plan.id === currentPlan)

  const handlePlanSelect = async (planId: string) => {
    if (planId === currentPlan) return

    setSelectedPlan(planId)
    setIsLoading(true)

    try {
      // Here you would normally integrate with a payment processor
      // For now, we'll just simulate the upgrade
      toast({
        title: 'Feature Coming Soon',
        description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} plan selection noted. Payment integration will be available soon!`,
        status: 'info',
        duration: 5000,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update subscription plan',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
      setSelectedPlan(null)
    }
  }

  const filteredPlans = showUpgradeOnly 
    ? SUBSCRIPTION_PLANS.filter(plan => plan.price > (currentPlanData?.price || 0))
    : SUBSCRIPTION_PLANS

  return (
    <VStack spacing={8} align="stretch">
      {!showUpgradeOnly && (
        <VStack spacing={4} textAlign="center">
          <Heading size="xl">Choose Your Plan</Heading>
          <Text color="gray.600" fontSize="lg" maxW="2xl">
            Start free and upgrade as you grow. All plans include our core content generation features.
          </Text>
        </VStack>
      )}

      {currentPlanData && (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="semibold">
              Current Plan: {currentPlanData.name}
            </Text>
            <Text fontSize="sm">
              {currentPlanData.max_content_per_month === -1 
                ? 'Unlimited content generation' 
                : `${currentPlanData.max_content_per_month} content pieces remaining this month`
              }
            </Text>
          </Box>
        </Alert>
      )}

      <Grid 
        templateColumns={{ base: '1fr', md: 'repeat(auto-fit, minmax(300px, 1fr))' }} 
        gap={6}
        maxW="1200px"
        mx="auto"
      >
        {filteredPlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={plan.id === currentPlan}
            isPopular={plan.id === 'pro'}
            onSelect={handlePlanSelect}
          />
        ))}
      </Grid>

      {showUpgradeOnly && filteredPlans.length === 0 && (
        <Alert status="success" borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="semibold">You're on the highest plan!</Text>
            <Text fontSize="sm">
              You have access to all features and unlimited content generation.
            </Text>
          </Box>
        </Alert>
      )}

      {!showUpgradeOnly && (
        <VStack spacing={4} textAlign="center" pt={8}>
          <Heading size="md">Not sure which plan is right for you?</Heading>
          <Text color="gray.600">
            Start with the Free plan and upgrade anytime. No commitments, cancel whenever you want.
          </Text>
          <HStack spacing={4}>
            <Button variant="outline" size="sm">
              View Feature Comparison
            </Button>
            <Button variant="outline" size="sm">
              Contact Sales
            </Button>
          </HStack>
        </VStack>
      )}
    </VStack>
  )
}