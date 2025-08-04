#!/usr/bin/env node

// QStash 테스트 스크립트
// Usage: node test-qstash.js

const { execSync } = require('child_process')

console.log('🚀 QStash 자동 스케줄링 테스트 시작...\n')

// 환경변수 확인
console.log('1️⃣ 환경변수 확인...')
const requiredEnvs = ['QSTASH_TOKEN', 'NEXT_PUBLIC_URL', 'ANTHROPIC_API_KEY']
const missingEnvs = requiredEnvs.filter(env => !process.env[env])

if (missingEnvs.length > 0) {
  console.error('❌ 누락된 환경변수:', missingEnvs.join(', '))
  console.log('\n📝 .env.local 파일에 다음 변수들을 설정하세요:')
  missingEnvs.forEach(env => console.log(`${env}=your_${env.toLowerCase()}`))
  process.exit(1)
}

console.log('✅ 환경변수 설정 완료')

// 개발 서버 실행 확인
console.log('\n2️⃣ 개발 서버 확인...')
try {
  const response = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/schedule/test', { timeout: 5000 })
  if (response.toString().trim() === '405') {
    console.log('✅ 개발 서버 실행 중')
  } else {
    throw new Error('Server not responding')
  }
} catch (error) {
  console.error('❌ 개발 서버가 실행되지 않았습니다.')
  console.log('다음 명령으로 서버를 시작하세요: npm run dev')
  process.exit(1)
}

// 테스트 스케줄 생성
console.log('\n3️⃣ 테스트 스케줄 생성...')
try {
  const result = execSync('curl -s -X POST http://localhost:3000/api/schedule/test', { 
    encoding: 'utf8',
    timeout: 10000 
  })
  
  const response = JSON.parse(result)
  
  if (response.success) {
    console.log('✅ QStash 테스트 스케줄 생성 성공!')
    console.log(`📅 실행 시간: ${response.executeAt}`)
    console.log(`🆔 스케줄 ID: ${response.scheduleId}`)
    console.log(`📨 QStash 메시지 ID: ${response.qstashMessageId}`)
    
    console.log('\n🎉 테스트 완료!')
    console.log('1분 후에 콘텐츠가 자동 생성됩니다.')
    console.log('👀 http://localhost:3000/content/library 에서 확인하세요.')
  } else {
    throw new Error(response.error)
  }
  
} catch (error) {
  console.error('❌ 테스트 실패:', error.message)
  
  if (error.message.includes('QStash not configured')) {
    console.log('\n🔧 QStash 설정을 확인하세요:')
    console.log('1. https://console.upstash.com 에서 QStash 프로젝트 생성')
    console.log('2. API 토큰을 .env.local에 추가')
    console.log('3. NEXT_PUBLIC_URL 확인')
  }
  
  process.exit(1)
}

console.log('\n📊 QStash 대시보드에서 메시지 상태 확인:')
console.log('🔗 https://console.upstash.com/qstash')