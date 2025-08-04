'use client'

import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  Button,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Icon,
  VStack,
  HStack,
  Badge,
  Progress,
} from '@chakra-ui/react'
import { AddIcon, CalendarIcon, ViewIcon, RepeatIcon } from '@chakra-ui/icons'
import Layout from '@/components/layout/Layout'

export default function Dashboard() {
  return (
    <Layout>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="xl" mb={2}>
            Welcome to AI SNS Contents Maker
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Generate and schedule your social media content automatically with AI
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Contents</StatLabel>
                <StatNumber>127</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  23.36%
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Published Today</StatLabel>
                <StatNumber>5</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  12%
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Scheduled</StatLabel>
                <StatNumber>23</StatNumber>
                <StatHelpText>Next 7 days</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Active Schedules</StatLabel>
                <StatNumber>3</StatNumber>
                <StatHelpText>Running automatically</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
          <Card>
            <CardHeader>
              <Heading size="md">Quick Actions</Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Button
                  leftIcon={<AddIcon />}
                  colorScheme="brand"
                  size="lg"
                  h="60px">
                  Create Content
                </Button>
                <Button
                  leftIcon={<CalendarIcon />}
                  variant="outline"
                  size="lg"
                  h="60px">
                  Schedule Content
                </Button>
                <Button
                  leftIcon={<ViewIcon />}
                  variant="outline"
                  size="lg"
                  h="60px">
                  View Analytics
                </Button>
                <Button
                  leftIcon={<RepeatIcon />}
                  variant="outline"
                  size="lg"
                  h="60px">
                  Auto Schedule
                </Button>
              </SimpleGrid>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <Heading size="md">Recent Activity</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Box>
                  <HStack justify="space-between">
                    <Text fontWeight="medium">Twitter post generated</Text>
                    <Badge colorScheme="green">Published</Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    2 minutes ago
                  </Text>
                </Box>
                <Box>
                  <HStack justify="space-between">
                    <Text fontWeight="medium">Instagram content scheduled</Text>
                    <Badge colorScheme="blue">Scheduled</Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    5 minutes ago
                  </Text>
                </Box>
                <Box>
                  <HStack justify="space-between">
                    <Text fontWeight="medium">LinkedIn article created</Text>
                    <Badge colorScheme="yellow">Draft</Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    1 hour ago
                  </Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </Grid>

        <Card>
          <CardHeader>
            <Heading size="md">Platform Performance</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              <Box>
                <Text fontWeight="medium" mb={2}>
                  Twitter
                </Text>
                <Progress value={80} colorScheme="blue" mb={2} />
                <Text fontSize="sm" color="gray.600">
                  45 posts this month
                </Text>
              </Box>
              <Box>
                <Text fontWeight="medium" mb={2}>
                  Instagram
                </Text>
                <Progress value={65} colorScheme="pink" mb={2} />
                <Text fontSize="sm" color="gray.600">
                  32 posts this month
                </Text>
              </Box>
              <Box>
                <Text fontWeight="medium" mb={2}>
                  LinkedIn
                </Text>
                <Progress value={40} colorScheme="blue" mb={2} />
                <Text fontSize="sm" color="gray.600">
                  18 posts this month
                </Text>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>
      </VStack>
    </Layout>
  )
}
