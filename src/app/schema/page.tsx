'use client'

import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Grid,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Divider,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Code,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  Flex,
  Spacer,
  Icon,
  SimpleGrid
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { Database, Table as TableIcon, Key, Link, Settings, Shield, Zap, GitBranch } from 'lucide-react'
import Layout from '@/components/layout/Layout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import SimpleDiagram from '@/components/schema/SimpleDiagram'
import ReactFlowDiagram from '@/components/schema/VisNetworkDiagram'

interface Column {
  name: string
  type: string
  primaryKey?: boolean
  nullable?: boolean
  default?: string
  description: string
}

interface Relationship {
  type: string
  table: string
  column: string
  description: string
}

interface TableSchema {
  name: string
  description: string
  columns: Column[]
  relationships: Relationship[]
}

interface EnumSchema {
  name: string
  values: string[]
  description: string
}

interface IndexSchema {
  table: string
  columns: string[]
  description: string
}

interface FunctionSchema {
  name: string
  description: string
  trigger?: string
  parameters?: string
  returns?: string
}

interface RLSPolicy {
  table: string
  description: string
}

interface SchemaData {
  tables: TableSchema[]
  enums: EnumSchema[]
  indexes: IndexSchema[]
  functions: FunctionSchema[]
  rls_policies: RLSPolicy[]
}

export default function SchemaPage() {
  const [schemaData, setSchemaData] = useState<SchemaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  useEffect(() => {
    fetchSchemaData()
  }, [])

  const fetchSchemaData = async () => {
    try {
      const response = await fetch('/api/schema')
      if (!response.ok) {
        throw new Error('Failed to fetch schema data')
      }
      const data = await response.json()
      setSchemaData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    if (type.includes('UUID')) return 'purple'
    if (type.includes('TEXT') || type.includes('VARCHAR')) return 'green'
    if (type.includes('INTEGER') || type.includes('DECIMAL')) return 'blue'
    if (type.includes('BOOLEAN')) return 'orange'
    if (type.includes('TIMESTAMP')) return 'cyan'
    if (type.includes('JSONB') || type.includes('JSON')) return 'pink'
    if (type.includes('ARRAY') || type.includes('[]')) return 'teal'
    if (type.includes('_enum') || type.includes('_type')) return 'red'
    return 'gray'
  }

  const renderTable = (table: TableSchema) => (
    <Card key={table.name} bg={cardBg} borderColor={borderColor}>
      <CardHeader pb={2}>
        <HStack>
          <Icon as={TableIcon} color="blue.500" />
          <VStack align="start" spacing={0} flex={1}>
            <Heading size="md" color="blue.600">
              {table.name}
            </Heading>
            <Text fontSize="sm" color="gray.600">
              {table.description}
            </Text>
          </VStack>
        </HStack>
      </CardHeader>
      
      <CardBody pt={0}>
        <VStack spacing={4} align="stretch">
          {/* Columns */}
          <Box>
            <Text fontSize="sm" fontWeight="semibold" mb={2} color="gray.700">
              컬럼 ({table.columns.length}개)
            </Text>
            <TableContainer>
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>이름</Th>
                    <Th>타입</Th>
                    <Th>속성</Th>
                    <Th>설명</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {table.columns.map((column) => (
                    <Tr key={column.name}>
                      <Td>
                        <HStack spacing={2}>
                          <Text fontFamily="mono" fontSize="sm">
                            {column.name}
                          </Text>
                          {column.primaryKey && (
                            <Icon as={Key} size={14} color="yellow.500" />
                          )}
                        </HStack>
                      </Td>
                      <Td>
                        <Badge colorScheme={getTypeColor(column.type)} fontSize="xs">
                          {column.type}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={1}>
                          {column.nullable === false && (
                            <Badge size="sm" colorScheme="red" variant="outline">
                              NOT NULL
                            </Badge>
                          )}
                          {column.default && (
                            <Badge size="sm" colorScheme="gray" variant="outline">
                              DEFAULT
                            </Badge>
                          )}
                        </HStack>
                      </Td>
                      <Td fontSize="sm" color="gray.600">
                        {column.description}
                        {column.default && (
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            기본값: {column.default}
                          </Text>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>

          {/* Relationships */}
          {table.relationships.length > 0 && (
            <Box>
              <Text fontSize="sm" fontWeight="semibold" mb={2} color="gray.700">
                관계 ({table.relationships.length}개)
              </Text>
              <VStack spacing={2} align="stretch">
                {table.relationships.map((rel, idx) => (
                  <Box key={idx} p={2} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                    <HStack>
                      <Icon as={Link} size={16} color="green.500" />
                      <Badge colorScheme="green" size="sm">
                        {rel.type}
                      </Badge>
                      <Text fontSize="sm">
                        → <Code fontSize="sm">{rel.table}.{rel.column}</Code>
                      </Text>
                    </HStack>
                    <Text fontSize="xs" color="gray.600" mt={1}>
                      {rel.description}
                    </Text>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}
        </VStack>
      </CardBody>
    </Card>
  )

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <VStack spacing={8} align="center" py={20}>
            <Database size={48} />
            <Text>스키마 정보를 불러오는 중...</Text>
          </VStack>
        </Layout>
      </ProtectedRoute>
    )
  }

  if (error || !schemaData) {
    return (
      <ProtectedRoute>
        <Layout>
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>스키마 로드 실패</AlertTitle>
            <AlertDescription>{error || '스키마 정보를 불러올 수 없습니다.'}</AlertDescription>
          </Alert>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <HStack mb={4}>
              <Icon as={Database} size={32} color="blue.500" />
              <VStack align="start" spacing={0}>
                <Heading size="xl" color="gray.800">
                  📊 데이터베이스 스키마
                </Heading>
                <Text color="gray.600" fontSize="lg">
                  AI SNS 콘텐츠 생성 플랫폼의 데이터베이스 구조 시각화
                </Text>
              </VStack>
            </HStack>
            
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
              <Card bg={cardBg} textAlign="center" p={4}>
                <VStack>
                  <Icon as={TableIcon} size={24} color="blue.500" />
                  <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                    {schemaData.tables.length}
                  </Text>
                  <Text fontSize="sm" color="gray.600">테이블</Text>
                </VStack>
              </Card>
              <Card bg={cardBg} textAlign="center" p={4}>
                <VStack>
                  <Icon as={Settings} size={24} color="purple.500" />
                  <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                    {schemaData.enums.length}
                  </Text>
                  <Text fontSize="sm" color="gray.600">열거형</Text>
                </VStack>
              </Card>
              <Card bg={cardBg} textAlign="center" p={4}>
                <VStack>
                  <Icon as={Zap} size={24} color="green.500" />
                  <Text fontSize="2xl" fontWeight="bold" color="green.600">
                    {schemaData.functions.length}
                  </Text>
                  <Text fontSize="sm" color="gray.600">함수</Text>
                </VStack>
              </Card>
              <Card bg={cardBg} textAlign="center" p={4}>
                <VStack>
                  <Icon as={Shield} size={24} color="red.500" />
                  <Text fontSize="2xl" fontWeight="bold" color="red.600">
                    {schemaData.rls_policies.length}
                  </Text>
                  <Text fontSize="sm" color="gray.600">RLS 정책</Text>
                </VStack>
              </Card>
            </SimpleGrid>
          </Box>

          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab>📋 테이블</Tab>
              <Tab>🏷️ 열거형</Tab>
              <Tab>⚡ 함수</Tab>
              <Tab>🔍 인덱스</Tab>
              <Tab>🛡️ 보안</Tab>
              <Tab>📊 다이어그램</Tab>
            </TabList>

            <TabPanels>
              {/* Tables Tab */}
              <TabPanel px={0}>
                <VStack spacing={6} align="stretch">
                  {schemaData.tables.map(renderTable)}
                </VStack>
              </TabPanel>

              {/* Enums Tab */}
              <TabPanel px={0}>
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                  {schemaData.enums.map((enumSchema) => (
                    <Card key={enumSchema.name} bg={cardBg}>
                      <CardHeader>
                        <HStack>
                          <Icon as={Settings} color="purple.500" />
                          <VStack align="start" spacing={0}>
                            <Heading size="md" color="purple.600">
                              {enumSchema.name}
                            </Heading>
                            <Text fontSize="sm" color="gray.600">
                              {enumSchema.description}
                            </Text>
                          </VStack>
                        </HStack>
                      </CardHeader>
                      <CardBody pt={0}>
                        <Text fontSize="sm" fontWeight="semibold" mb={2}>
                          가능한 값:
                        </Text>
                        <Flex wrap="wrap" gap={2}>
                          {enumSchema.values.map((value) => (
                            <Badge key={value} colorScheme="purple" variant="outline">
                              {value}
                            </Badge>
                          ))}
                        </Flex>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              </TabPanel>

              {/* Functions Tab */}
              <TabPanel px={0}>
                <VStack spacing={4} align="stretch">
                  {schemaData.functions.map((func) => (
                    <Card key={func.name} bg={cardBg}>
                      <CardBody>
                        <HStack align="start" spacing={4}>
                          <Icon as={Zap} color="green.500" mt={1} />
                          <VStack align="start" spacing={2} flex={1}>
                            <Code colorScheme="green" fontSize="md">
                              {func.name}
                            </Code>
                            <Text fontSize="sm" color="gray.600">
                              {func.description}
                            </Text>
                            {func.trigger && (
                              <Badge colorScheme="orange" size="sm">
                                트리거: {func.trigger}
                              </Badge>
                            )}
                            {func.parameters && (
                              <Text fontSize="xs" color="gray.500">
                                매개변수: {func.parameters}
                              </Text>
                            )}
                            {func.returns && (
                              <Text fontSize="xs" color="gray.500">
                                반환값: {func.returns}
                              </Text>
                            )}
                          </VStack>
                        </HStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              </TabPanel>

              {/* Indexes Tab */}
              <TabPanel px={0}>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>테이블</Th>
                        <Th>컬럼</Th>
                        <Th>설명</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {schemaData.indexes.map((index, idx) => (
                        <Tr key={idx}>
                          <Td>
                            <Badge colorScheme="blue">
                              {index.table}
                            </Badge>
                          </Td>
                          <Td>
                            <Code fontSize="sm">
                              {index.columns.join(', ')}
                            </Code>
                          </Td>
                          <Td fontSize="sm" color="gray.600">
                            {index.description}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </TabPanel>

              {/* Security Tab */}
              <TabPanel px={0}>
                <VStack spacing={4} align="stretch">
                  <Alert status="info">
                    <AlertIcon />
                    <AlertTitle>Row Level Security (RLS)</AlertTitle>
                    <AlertDescription>
                      모든 테이블에 RLS가 활성화되어 사용자별 데이터 접근을 제한합니다.
                    </AlertDescription>
                  </Alert>
                  
                  {schemaData.rls_policies.map((policy, idx) => (
                    <Card key={idx} bg={cardBg}>
                      <CardBody>
                        <HStack align="start">
                          <Icon as={Shield} color="red.500" mt={1} />
                          <VStack align="start" spacing={1}>
                            <Badge colorScheme="red">
                              {policy.table}
                            </Badge>
                            <Text fontSize="sm" color="gray.600">
                              {policy.description}
                            </Text>
                          </VStack>
                        </HStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              </TabPanel>

              {/* Diagrams Tab */}
              <TabPanel px={0}>
                <VStack spacing={6} align="stretch">
                  <Alert status="info">
                    <AlertIcon />
                    <AlertTitle>다이어그램 안내</AlertTitle>
                    <AlertDescription>
                      데이터베이스 스키마를 다양한 방식으로 시각화합니다. 간단 버전과 인터랙티브 네트워크 다이어그램을 제공합니다.
                    </AlertDescription>
                  </Alert>

                  <Tabs variant="soft-rounded" colorScheme="purple" defaultIndex={1}>
                    <TabList>
                      <Tab>🎨 간단 버전</Tab>
                      <Tab>🌐 네트워크</Tab>
                    </TabList>
                    
                    <TabPanels>
                      {/* Simple Diagrams Tab */}
                      <TabPanel px={0}>
                        <VStack spacing={6} align="stretch">
                          <Alert status="info">
                            <AlertIcon />
                            <AlertTitle>간단한 다이어그램</AlertTitle>
                            <AlertDescription>
                              HTML/CSS로 구현된 가볍고 빠른 다이어그램입니다. 별도 라이브러리 없이 즉시 렌더링됩니다.
                            </AlertDescription>
                          </Alert>

                          <Tabs variant="enclosed" size="sm">
                            <TabList>
                              <Tab>ERD</Tab>
                              <Tab>관계도</Tab>
                              <Tab>데이터 플로우</Tab>
                            </TabList>
                            
                            <TabPanels>
                              <TabPanel>
                                <Card bg={cardBg}>
                                  <CardBody>
                                    <SimpleDiagram type="erd" />
                                  </CardBody>
                                </Card>
                              </TabPanel>
                              
                              <TabPanel>
                                <Card bg={cardBg}>
                                  <CardBody>
                                    <SimpleDiagram type="flowchart" />
                                  </CardBody>
                                </Card>
                              </TabPanel>
                              
                              <TabPanel>
                                <Card bg={cardBg}>
                                  <CardBody>
                                    <SimpleDiagram type="dataflow" />
                                  </CardBody>
                                </Card>
                              </TabPanel>
                            </TabPanels>
                          </Tabs>
                        </VStack>
                      </TabPanel>

                      {/* React Flow Network Tab */}
                      <TabPanel px={0}>
                        <VStack spacing={6} align="stretch">
                          <Alert status="success">
                            <AlertIcon />
                            <AlertTitle>React Flow 인터랙티브 다이어그램</AlertTitle>
                            <AlertDescription>
                              React Flow로 구현된 인터랙티브 네트워크입니다. 노드를 드래그하고 줌/팬이 가능하며 미니맵도 제공됩니다.
                            </AlertDescription>
                          </Alert>

                          <Tabs variant="enclosed" size="sm">
                            <TabList>
                              <Tab>🔄 동적 레이아웃</Tab>
                              <Tab>📊 계층형 레이아웃</Tab>
                            </TabList>
                            
                            <TabPanels>
                              <TabPanel>
                                <Card bg={cardBg}>
                                  <CardHeader>
                                    <VStack align="start" spacing={0}>
                                      <Heading size="md" color="blue.600">
                                        동적 네트워크 다이어그램
                                      </Heading>
                                      <Text fontSize="sm" color="gray.600">
                                        물리 시뮬레이션으로 자동 배치되는 인터랙티브 다이어그램
                                      </Text>
                                    </VStack>
                                  </CardHeader>
                                  <CardBody pt={0}>
                                    <ReactFlowDiagram 
                                      schemaData={schemaData} 
                                      type="network"
                                    />
                                  </CardBody>
                                </Card>
                              </TabPanel>
                              
                              <TabPanel>
                                <Card bg={cardBg}>
                                  <CardHeader>
                                    <VStack align="start" spacing={0}>
                                      <Heading size="md" color="green.600">
                                        계층형 네트워크 다이어그램  
                                      </Heading>
                                      <Text fontSize="sm" color="gray.600">
                                        위아래 계층 구조로 정렬된 다이어그램
                                      </Text>
                                    </VStack>
                                  </CardHeader>
                                  <CardBody pt={0}>
                                    <ReactFlowDiagram 
                                      schemaData={schemaData} 
                                      type="hierarchy"
                                    />
                                  </CardBody>
                                </Card>
                              </TabPanel>
                            </TabPanels>
                          </Tabs>
                        </VStack>
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Layout>
    </ProtectedRoute>
  )
}