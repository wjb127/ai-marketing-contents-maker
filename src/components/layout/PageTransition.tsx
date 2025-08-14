'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'

interface PageTransitionProps {
  children: ReactNode
}

// 페이지 순서 정의 (왼쪽에서 오른쪽 순)
const pageOrder = [
  '/',
  '/content/create',
  '/content/library',
  '/schedule',
  '/subscription',
  '/admin/prompts',
]

// 페이지 인덱스 가져오기
const getPageIndex = (pathname: string): number => {
  const index = pageOrder.findIndex(path => pathname === path || pathname.startsWith(path + '/'))
  return index !== -1 ? index : pageOrder.length
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [prevPathname, setPrevPathname] = useState(pathname)
  const [direction, setDirection] = useState(0)

  useEffect(() => {
    if (pathname !== prevPathname) {
      const currentIndex = getPageIndex(pathname)
      const prevIndex = getPageIndex(prevPathname)
      
      // 방향 결정: 오른쪽으로 이동하면 1, 왼쪽으로 이동하면 -1
      setDirection(currentIndex > prevIndex ? 1 : -1)
      setPrevPathname(pathname)
    }
  }, [pathname, prevPathname])

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? '-100%' : '100%',
      opacity: 0,
    }),
  }

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={pathname}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          x: { type: 'spring', stiffness: 300, damping: 30 },
          opacity: { duration: 0.2 },
        }}
        style={{ width: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}