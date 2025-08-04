'use client'

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Divider,
  HStack,
  useToast,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { FaGoogle } from 'react-icons/fa'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: number
}

export default function AuthModal({ isOpen, onClose, defaultTab = 0 }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [tabIndex, setTabIndex] = useState(defaultTab)
  const [message, setMessage] = useState('')
  
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const toast = useToast()

  const handleSubmit = async (isSignUp: boolean) => {
    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        status: 'error',
        duration: 3000,
      })
      return
    }

    if (isSignUp && password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        status: 'error',
        duration: 3000,
      })
      return
    }

    setLoading(true)
    setMessage('')

    try {
      if (isSignUp) {
        await signUp(email, password)
        setMessage('Please check your email for a confirmation link.')
      } else {
        await signIn(email, password)
        toast({
          title: 'Success',
          description: 'Successfully signed in!',
          status: 'success',
          duration: 3000,
        })
        onClose()
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to sign in with Google',
        status: 'error',
        duration: 5000,
      })
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setMessage('')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Welcome to AI SNS Maker</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Tabs index={tabIndex} onChange={(index) => {
            setTabIndex(index)
            resetForm()
          }}>
            <TabList>
              <Tab>Sign In</Tab>
              <Tab>Sign Up</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <VStack spacing={4}>
                  {message && (
                    <Alert status="info">
                      <AlertIcon />
                      {message}
                    </Alert>
                  )}
                  
                  <FormControl>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Password</FormLabel>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                    />
                  </FormControl>

                  <Button
                    colorScheme="brand"
                    width="100%"
                    onClick={() => handleSubmit(false)}
                    isLoading={loading}
                    loadingText="Signing in..."
                  >
                    Sign In
                  </Button>

                  <HStack width="100%">
                    <Divider />
                    <Text fontSize="sm" color="gray.500" whiteSpace="nowrap">
                      or continue with
                    </Text>
                    <Divider />
                  </HStack>

                  <Button
                    variant="outline"
                    width="100%"
                    leftIcon={<FaGoogle />}
                    onClick={handleGoogleSignIn}
                  >
                    Continue with Google
                  </Button>
                </VStack>
              </TabPanel>

              <TabPanel>
                <VStack spacing={4}>
                  {message && (
                    <Alert status="info">
                      <AlertIcon />
                      {message}
                    </Alert>
                  )}

                  <FormControl>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Password</FormLabel>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Confirm Password</FormLabel>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                    />
                  </FormControl>

                  <Button
                    colorScheme="brand"
                    width="100%"
                    onClick={() => handleSubmit(true)}
                    isLoading={loading}
                    loadingText="Creating account..."
                  >
                    Create Account
                  </Button>

                  <HStack width="100%">
                    <Divider />
                    <Text fontSize="sm" color="gray.500" whiteSpace="nowrap">
                      or continue with
                    </Text>
                    <Divider />
                  </HStack>

                  <Button
                    variant="outline"
                    width="100%"
                    leftIcon={<FaGoogle />}
                    onClick={handleGoogleSignIn}
                  >
                    Continue with Google
                  </Button>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}